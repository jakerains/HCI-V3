import { useState, useCallback, useEffect, useRef } from 'react'

interface VoiceRecognitionHook {
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  error: string | null
  setTranscript: (transcript: string) => void
}

export function useVoiceRecognition(): VoiceRecognitionHook {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        setError('Speech recognition is not supported in this browser.')
        return
      }

      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognitionInstance = new SpeechRecognition()

      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onstart = () => {
        console.log('Voice recognition started')
        setIsListening(true)
        setError(null)
      }

      recognitionInstance.onerror = (event) => {
        console.error('Voice recognition error:', event.error)
        if (event.error !== 'no-speech') {
          setError(`Error: ${event.error}`)
          setIsListening(false)
        }
      }

      let finalTranscriptTimeout: NodeJS.Timeout | null = null

      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex
        const transcript = event.results[current][0].transcript.trim()
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        if (finalTranscriptTimeout) {
          clearTimeout(finalTranscriptTimeout)
        }

        console.log('Transcript:', transcript)
        
        if (event.results[current].isFinal) {
          console.log('Final transcript:', transcript)
          finalTranscriptTimeout = setTimeout(() => {
            setTranscript(transcript)
            finalTranscriptTimeout = null
          }, 1000) // Wait for any final adjustments
        }
      }

      recognitionInstance.onend = () => {
        console.log('Voice recognition ended')
        setIsListening(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
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
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Error starting recognition:', err)
        setError('Failed to start voice recognition')
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        recognitionRef.current.stop()
      } catch (err) {
        console.error('Error stopping recognition:', err)
      }
    }
  }, [])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    setTranscript
  }
} 