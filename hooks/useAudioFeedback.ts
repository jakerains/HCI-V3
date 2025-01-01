import { useCallback } from 'react'
import { config } from '@/lib/config'

export function useAudioFeedback() {
  const playAudioFeedback = useCallback(async (text: string) => {
    try {
      console.log('Attempting to fetch audio...')
      
      // Get API key from localStorage
      const apiKey = localStorage.getItem('elevenLabsApiKey')

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-elevenlabs-key': apiKey || '',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`)
      }

      console.log('Audio fetched successfully, attempting to play...')
      
      try {
        // Create audio context with fallbacks
        const AudioContext = window.AudioContext || window.webkitAudioContext
        const audioContext = new AudioContext()
        
        // Safari and some browsers need to resume the context after creation
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }

        const arrayBuffer = await response.arrayBuffer()
        
        // Handle decoding with proper error handling
        try {
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          const source = audioContext.createBufferSource()
          source.buffer = audioBuffer
          source.connect(audioContext.destination)
          
          // Start playback with fallback for older browsers
          if (source.start) {
            source.start(0)
          } else {
            (source as any).noteOn(0)
          }
          
          console.log('Audio played successfully')
          
          // Clean up after playback
          source.onended = () => {
            source.disconnect()
            // Don't close the context as it may be reused
          }
        } catch (decodeError) {
          console.error('Error decoding audio:', decodeError)
          throw new Error('Failed to decode audio. Please try again.')
        }
      } catch (audioError) {
        console.error('Audio playback error:', audioError)
        // Fallback to native audio element if Web Audio API fails
        const blob = new Blob([await response.arrayBuffer()], { type: 'audio/mpeg' })
        const audio = new Audio(URL.createObjectURL(blob))
        await audio.play()
        console.log('Audio played successfully using fallback')
      }
    } catch (error) {
      console.error('Detailed error in playAudioFeedback:', error)
      throw error
    }
  }, [])

  return playAudioFeedback
}

