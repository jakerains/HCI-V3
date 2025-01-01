import { useState, useCallback, useEffect, useRef } from 'react'

interface VoiceRecognitionHook {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  error: string | null
  setTranscript: (transcript: string) => void
}

// Common misrecognitions of "helm"
const HELM_ALIASES = [
  'helm',
  'home',
  'hell',
  'help',
  'held',
  'health',
  'hem',
  'hum'
]

export function useVoiceRecognition(): VoiceRecognitionHook {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for browser support
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition || 
                               (window as any).mozSpeechRecognition || 
                               (window as any).msSpeechRecognition

      if (!SpeechRecognition) {
        setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
        return
      }

      const recognitionInstance = new SpeechRecognition()

      // Configure for optimal voice command recognition
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'
      
      // Some browsers need these explicitly set
      recognitionInstance.maxAlternatives = 1
      recognitionInstance.serviceURI = 'http://localhost:2700'

      recognitionInstance.onstart = () => {
        console.log('Voice recognition started')
        setIsListening(true)
        setError(null)
        processingRef.current = false
      }

      recognitionInstance.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error)
        // Don't show error for no-speech as it's common
        if (event.error !== 'no-speech') {
          let errorMessage = 'Error: '
          switch (event.error) {
            case 'network':
              errorMessage += 'Network error occurred. Please check your connection.'
              break
            case 'not-allowed':
            case 'permission-denied':
              errorMessage += 'Microphone access denied. Please check your browser permissions.'
              break
            case 'service-not-allowed':
              errorMessage += 'Speech service not allowed. Please check your browser settings.'
              break
            default:
              errorMessage += event.error
          }
          setError(errorMessage)
          setIsListening(false)
        }
      }

      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex
        const transcript = event.results[current][0].transcript.trim()
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        console.log('Transcript:', transcript)
        
        if (event.results[current].isFinal) {
          console.log('Final transcript:', transcript)
          
          // Check for any of the helm aliases at the start of the transcript
          const words = transcript.toLowerCase().split(/\s+/)
          const startsWithHelm = HELM_ALIASES.some(alias => words[0] === alias)
          
          if (startsWithHelm && !processingRef.current) {
            processingRef.current = true
            
            // Replace the misrecognized word with "helm"
            const correctedTranscript = 'helm' + transcript.slice(words[0].length)
            
            timeoutRef.current = setTimeout(() => {
              setTranscript(correctedTranscript)
              processingRef.current = false
            }, 500)
          }
        }
      }

      recognitionInstance.onend = () => {
        console.log('Voice recognition ended')
        setIsListening(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        processingRef.current = false
      }

      recognitionRef.current = recognitionInstance

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop()
          } catch (err) {
            console.error('Error stopping recognition on cleanup:', err)
          }
        }
        processingRef.current = false
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        if (!isListening) {
          // Request microphone permission explicitly
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
              processingRef.current = false
              recognitionRef.current.start()
            })
            .catch((err) => {
              console.error('Microphone permission error:', err)
              setError('Microphone access denied. Please check your browser permissions.')
              setIsListening(false)
            })
        }
      } catch (err) {
        console.error('Error starting recognition:', err)
        setError('Failed to start voice recognition. Please refresh the page and try again.')
        setIsListening(false)
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        if (isListening) {
          recognitionRef.current.stop()
        }
        processingRef.current = false
      } catch (err) {
        console.error('Error stopping recognition:', err)
      }
    }
  }, [isListening])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    setTranscript
  }
} 