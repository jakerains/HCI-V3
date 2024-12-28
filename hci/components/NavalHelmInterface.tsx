'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { useToast } from "./ui/use-toast"
import ShipStatus from './ShipStatus'
import CommandLog from './CommandLog'
import CompassDisplay from './CompassDisplay'
import { ElevenLabsClient } from 'elevenlabs'

// Command patterns for better recognition
const COMMAND_PATTERNS = {
  LEFT: /left\s+(\d+)\s+degrees?/i,
  RIGHT: /right\s+(\d+)\s+degrees?/i,
  STEADY: /steady\s+course\s+(\d+)/i,
  ALL_AHEAD: /all\s+ahead\s+(full|half|slow)/i,
  ALL_STOP: /all\s+stop/i,
}

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID

export default function NavalHelmInterface() {
  const [shipState, setShipState] = useState({
    rudder: 0,
    course: 0,
    speed: 0
  })

  const [isMuted, setIsMuted] = useState(false)
  const [lastCommand, setLastCommand] = useState('')
  const [commandLog, setCommandLog] = useState<string[]>([])
  const [screenResponse, setScreenResponse] = useState('')
  const [processingCommand, setProcessingCommand] = useState(false)

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    error,
    setTranscript 
  } = useVoiceRecognition()
  const { toast } = useToast()

  const playAudioResponse = async (text: string) => {
    if (isMuted) return
    
    try {
      if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
        console.log('Using ElevenLabs with voice ID:', ELEVENLABS_VOICE_ID)
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75,
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`)
        }

        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        return new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            resolve(true)
          }
          audio.onerror = reject
          audio.play().catch(reject)
        })
      } else {
        // Fallback to browser speech synthesis
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 0.9
          utterance.pitch = 1
          utterance.onend = () => resolve(true)
          window.speechSynthesis.speak(utterance)
        })
      }
    } catch (error) {
      console.error('Audio playback error:', error)
      toast({
        title: "Audio Error",
        description: "Failed to play audio response",
        variant: "destructive",
      })
      return Promise.reject(error)
    }
  }

  const processCommand = useCallback(async (command: string) => {
    if (processingCommand) return
    
    setProcessingCommand(true)
    try {
      console.log('Raw command:', command)
      const normalizedCommand = command.toLowerCase()
        .replace(/^(home|help|hell|held|health|helm,)\s*/i, 'helm ')
        .trim()

      console.log('Normalized command:', normalizedCommand)
      
      if (!normalizedCommand.startsWith('helm ')) {
        console.log('Not a helm command')
        return
      }

      const cleanCommand = normalizedCommand.replace(/^helm\s+/, '').trim()
      if (!cleanCommand) {
        console.log('Empty command')
        return
      }

      setLastCommand(command)
      setCommandLog(prev => [command, ...prev].slice(0, 5))

      let response = 'Command not recognized'
      let commandExecuted = false

      // Left turn
      const leftMatch = cleanCommand.match(/left\s+(\d+)[°\s]*degrees?/i)
      if (leftMatch) {
        const degrees = Math.min(parseInt(leftMatch[1]), 30)
        setShipState(prev => ({ 
          ...prev, 
          rudder: -degrees,
          course: (prev.course - degrees + 360) % 360 
        }))
        response = `Left ${degrees} degrees rudder, helm, aye`
        commandExecuted = true
      }

      // Right turn
      const rightMatch = cleanCommand.match(/right\s+(\d+)[°\s]*degrees?/i)
      if (rightMatch) {
        const degrees = Math.min(parseInt(rightMatch[1]), 30)
        setShipState(prev => ({ 
          ...prev, 
          rudder: degrees,
          course: (prev.course + degrees) % 360 
        }))
        response = `Right ${degrees} degrees rudder, helm, aye`
        commandExecuted = true
      }

      // Steady course
      const steadyMatch = cleanCommand.match(/steady\s+course\s+(\d+)/i)
      if (steadyMatch) {
        const course = parseInt(steadyMatch[1]) % 360
        setShipState(prev => ({ ...prev, rudder: 0, course }))
        response = `Steady course ${course}, helm, aye`
        commandExecuted = true
      }

      // Speed commands
      const aheadMatch = cleanCommand.match(/all\s+ahead\s+(full|half|slow)/i)
      if (aheadMatch) {
        const speedMap = { full: 100, half: 50, slow: 25 }
        const speed = speedMap[aheadMatch[1].toLowerCase() as keyof typeof speedMap]
        setShipState(prev => ({ ...prev, speed }))
        response = `All ahead ${aheadMatch[1]}, helm, aye`
        commandExecuted = true
      }

      if (/all\s+stop/i.test(cleanCommand)) {
        setShipState(prev => ({ ...prev, speed: 0 }))
        response = 'All stop, helm, aye'
        commandExecuted = true
      }

      console.log('Command executed:', commandExecuted, 'Response:', response)
      setScreenResponse(response)

      if (!commandExecuted) {
        toast({
          title: "Command Not Recognized",
          description: "Please try again with a valid helm command",
          variant: "destructive",
        })
      } else {
        await playAudioResponse(response)
      }
    } catch (error) {
      console.error('Command processing error:', error)
      toast({
        title: "Command Error",
        description: "Failed to process command",
        variant: "destructive",
      })
    } finally {
      setProcessingCommand(false)
    }
  }, [playAudioResponse, toast])

  // Handle transcript updates
  useEffect(() => {
    if (!transcript || processingCommand) return
    
    const processTranscript = async () => {
      console.log('Processing transcript:', transcript)
      await processCommand(transcript)
      setTranscript('')
    }

    processTranscript()
  }, [transcript, processCommand, setTranscript])

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Voice recognition error:', error)
      toast({
        title: "Voice Recognition Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Naval Ship's Helm Command Interface (Secure)</h1>
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Ship Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ShipStatus {...shipState} />
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Compass</CardTitle>
          </CardHeader>
          <CardContent>
            <CompassDisplay course={shipState.course} />
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 flex justify-center space-x-4">
        <Button 
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onMouseLeave={stopListening}
          variant={isListening ? "destructive" : "default"} 
          size="lg"
          className="min-w-[200px]"
        >
          {isListening ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
          {isListening ? 'Listening...' : 'Press and Hold to Speak'}
        </Button>
        <Button 
          onClick={toggleMute} 
          variant="secondary" 
          size="lg"
          className="bg-gray-700 text-white hover:bg-gray-600"
        >
          {isMuted ? <VolumeX className="mr-2 h-5 w-5" /> : <Volume2 className="mr-2 h-5 w-5" />}
          {isMuted ? 'Unmute' : 'Mute'}
        </Button>
      </div>
      <Card className="mt-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Command Log</CardTitle>
        </CardHeader>
        <CardContent>
          <CommandLog commands={commandLog} />
        </CardContent>
      </Card>
      <Card className="mt-6 bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Last Command Response</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-white">{screenResponse}</p>
        </CardContent>
      </Card>
    </div>
  )
}

