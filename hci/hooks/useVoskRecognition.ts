'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface VoskMessage {
  text?: string
  partial?: string
}

// AudioWorklet processor code
const audioWorkletCode = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.processCount = 0
    this.isRunning = true
    this.sampleRate = 16000
    console.log('AudioProcessor created with sample rate:', this.sampleRate)

    // Handle stop message
    this.port.onmessage = (event) => {
      if (event.data.command === 'stop') {
        console.log('AudioProcessor received stop command')
        this.isRunning = false
      }
    }
  }

  process(inputs, outputs, parameters) {
    if (!this.isRunning) {
      console.log('AudioProcessor stopping')
      return false
    }
    
    const input = inputs[0]
    if (input && input.length > 0) {
      const inputData = input[0]
      
      // Debug input data
      if (this.processCount === 0) {
        console.log('First audio frame details:', {
          channels: input.length,
          samples: inputData.length,
          nonZeroSamples: inputData.filter(x => x !== 0).length,
          sampleRange: [Math.min(...inputData), Math.max(...inputData)]
        })
      }
      
      // Log every 50 frames to avoid console spam but ensure we're getting data
      if (this.processCount % 50 === 0) {
        const nonZeroCount = inputData.filter(x => x !== 0).length
        console.log('Processing audio frame:', {
          frame: this.processCount,
          length: inputData.length,
          nonZeroSamples: nonZeroCount,
          hasAudio: nonZeroCount > 0
        })
      }
      this.processCount++

      if (this.isRunning) {
        try {
          // Convert float32 to 16-bit PCM
          const pcmData = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            // Clamp the float32 signal to [-1, 1] and apply gain
            const sample = Math.max(-1, Math.min(1, inputData[i])) * 0.8
            // Convert to 16-bit PCM
            pcmData[i] = Math.floor(sample < 0 ? sample * 0x8000 : sample * 0x7FFF)
          }
          
          // Send the PCM buffer to the main thread
          this.port.postMessage(pcmData.buffer, [pcmData.buffer])
        } catch (error) {
          console.error('Error processing audio data:', error)
        }
      }
    } else {
      if (this.processCount % 100 === 0) {
        console.warn('No input data received', {
          inputExists: !!input,
          inputLength: input ? input.length : 0
        })
      }
    }
    return this.isRunning
  }
}
registerProcessor('audio-processor', AudioProcessor)
`

export function useVoskRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const messageCountRef = useRef(0)
  const dataCountRef = useRef(0)
  const collectingCommandRef = useRef(false)
  const commandBufferRef = useRef('')
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize AudioWorklet
  const initAudioWorklet = useCallback(async (audioContext: AudioContext) => {
    console.log('Initializing AudioWorklet...')
    const blob = new Blob([audioWorkletCode], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    await audioContext.audioWorklet.addModule(url)
    console.log('AudioWorklet initialized')
    URL.revokeObjectURL(url)
  }, [])

  const startListening = useCallback(async () => {
    try {
      console.log('Starting voice recognition...')
      
      // Create audio context first
      const audioContext = new AudioContext({
        sampleRate: 16000,
        latencyHint: 'interactive'
      })
      console.log('AudioContext created, sample rate:', audioContext.sampleRate)
      audioContextRef.current = audioContext

      // Resume audio context (needed in some browsers)
      if (audioContext.state !== 'running') {
        await audioContext.resume()
        console.log('AudioContext resumed')
      }

      // Get microphone access with more flexible constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 16000 },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      console.log('Microphone access granted')
      mediaStreamRef.current = stream

      // Get the actual constraints that were granted
      const track = stream.getAudioTracks()[0]
      const settings = track.getSettings()
      console.log('Actual audio settings:', settings)
      
      // Initialize AudioWorklet
      await initAudioWorklet(audioContext)

      // Create WebSocket connection
      const ws = new WebSocket('ws://localhost:2700')
      
      ws.onopen = () => {
        console.log('Connected to Vosk server')
        setIsListening(true)
        setSocket(ws)
      }

      ws.onmessage = (event) => {
        try {
          messageCountRef.current++
          const data: VoskMessage = JSON.parse(event.data)
          console.log('Raw message from Vosk:', event.data)
          
          // Clear any existing silence timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current)
          }
          
          const currentText = (data.partial || data.text || '').toLowerCase().trim()
          
          // More robust helm detection - check for common misrecognitions
          const isHelmTrigger = (text: string) => {
            const words = text.split(/\s+/)
            return words.some(word => 
              word === 'helm' || 
              word === 'hell' || 
              word === 'help' || 
              word === 'held' ||
              word.startsWith('helm') ||
              word.endsWith('helm')
            )
          }

          // Check if we have a complete command
          const isCompleteCommand = (text: string) => {
            return text.includes('helm') && (
              (text.includes('degree') && text.includes('rudder')) ||
              (text.includes('steady') && text.includes('course')) ||
              (text.includes('all') && (text.includes('stop') || text.includes('ahead')))
            )
          }
          
          if (isHelmTrigger(currentText) && !collectingCommandRef.current) {
            // Start collecting a new command
            collectingCommandRef.current = true
            commandBufferRef.current = currentText.replace(/\b(hell|help|held)\b/g, 'helm')
            console.log('Started collecting command:', commandBufferRef.current)
          } else if (collectingCommandRef.current && currentText) {
            // Continue collecting command, ensuring "helm" is preserved
            commandBufferRef.current = currentText.replace(/\b(hell|help|held)\b/g, 'helm')
            console.log('Collecting command:', commandBufferRef.current)
            
            // Check if we have a complete command
            if (isCompleteCommand(commandBufferRef.current)) {
              console.log('Complete command detected:', commandBufferRef.current)
              setTranscript(commandBufferRef.current)
              collectingCommandRef.current = false
              commandBufferRef.current = ''
            } else {
              // Set a timeout to finalize the command after silence
              if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current)
              }
              silenceTimeoutRef.current = setTimeout(() => {
                if (collectingCommandRef.current && commandBufferRef.current) {
                  console.log('Command completed after silence:', commandBufferRef.current)
                  setTranscript(commandBufferRef.current)
                  collectingCommandRef.current = false
                  commandBufferRef.current = ''
                }
              }, 1000) // Wait 1 second of silence before finalizing
            }
          } else if (collectingCommandRef.current && !currentText) {
            // If we get an empty message while collecting, it might indicate silence
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current)
            }
            silenceTimeoutRef.current = setTimeout(() => {
              if (collectingCommandRef.current && commandBufferRef.current) {
                console.log('Command completed after silence:', commandBufferRef.current)
                setTranscript(commandBufferRef.current)
                collectingCommandRef.current = false
                commandBufferRef.current = ''
              }
            }, 500) // Shorter timeout for empty messages
          }
          
        } catch (error) {
          console.error('Error parsing message:', error)
          console.log('Raw message data:', event.data)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsListening(false)
      }

      ws.onclose = () => {
        console.log('Disconnected from Vosk server')
        setIsListening(false)
        setSocket(null)
      }

      // Set up audio processing pipeline
      const source = audioContext.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(audioContext, 'audio-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
        processorOptions: {
          sampleRate: audioContext.sampleRate
        }
      })
      workletNodeRef.current = workletNode

      // Add error handling for the worklet
      workletNode.onprocessorerror = (err) => {
        console.error('AudioWorklet processing error:', err)
      }

      // Process and send audio data
      workletNode.port.onmessage = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            dataCountRef.current++
            ws.send(event.data)
            // Log occasionally to verify data is being sent
            if (dataCountRef.current % 100 === 0) {
              console.log('Audio data stats:', {
                count: dataCountRef.current,
                bufferSize: event.data.byteLength,
                wsState: ws.readyState
              })
            }
          } catch (error) {
            console.error('Error sending audio data:', error)
          }
        }
      }

      // Connect audio nodes
      source.connect(workletNode)
      console.log('Audio processing pipeline set up')
    } catch (error) {
      console.error('Error starting voice recognition:', error)
      setIsListening(false)
      // Cleanup on error
      if (audioContextRef.current) {
        await audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
    }
  }, [initAudioWorklet])

  const stopListening = useCallback(async () => {
    console.log('Stopping voice recognition...')
    
    // Clear any existing silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    
    // Reset command collection state
    collectingCommandRef.current = false
    commandBufferRef.current = ''
    
    // First, stop the media stream to prevent new audio data
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Media track stopped')
      })
      mediaStreamRef.current = null
    }

    // Disconnect and cleanup AudioWorklet
    if (workletNodeRef.current) {
      try {
        // Send message to stop processing and wait a bit for it to complete
        workletNodeRef.current.port.postMessage({ command: 'stop' })
        await new Promise(resolve => setTimeout(resolve, 100)) // Give time for the stop command to be processed
        
        // Disconnect the node
        workletNodeRef.current.disconnect()
        console.log('AudioWorklet node disconnected')
        workletNodeRef.current = null
      } catch (error) {
        console.error('Error cleaning up AudioWorklet:', error)
      }
    }

    // Close audio context
    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close()
        console.log('AudioContext closed')
        audioContextRef.current = null
      } catch (error) {
        console.error('Error closing AudioContext:', error)
      }
    }

    // Close WebSocket last
    if (socket) {
      try {
        socket.close()
        console.log('WebSocket closed')
        setSocket(null)
      } catch (error) {
        console.error('Error closing WebSocket:', error)
      }
    }

    setIsListening(false)
    setTranscript('')
    console.log('Voice recognition stopped')
  }, [socket])

  // Cleanup on unmount
  useEffect(() => {
    // Only run cleanup if we were actually listening
    return () => {
      if (isListening) {
        stopListening()
      }
    }
  }, [stopListening, isListening])

  return {
    isListening,
    transcript,
    startListening,
    stopListening
  }
} 