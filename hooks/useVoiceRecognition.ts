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
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const processingRef = useRef(false)

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
        processingRef.current = false
      }

      recognitionInstance.onerror = (event) => {
        console.error('Voice recognition error:', event.error)
        if (event.error !== 'no-speech') {
          setError(`Error: ${event.error}`)
          setIsListening(false)
        }
      }

      recognitionInstance.onresult = (event) => {
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
          processingRef.current = false
          recognitionRef.current.start()
        }
      } catch (err) {
        console.error('Error starting recognition:', err)
        setError('Failed to start voice recognition')
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