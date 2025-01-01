'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Mic, MicOff, Volume2, VolumeX, ArrowUp, ArrowDown, Pause, Gauge, Anchor, Ship, Radio, History, Navigation2, Compass, Settings, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { useToast } from "@/components/ui/use-toast"
import { ShipStatus } from './ShipStatus'
import CommandLog from './CommandLog'
import { CompassDisplay } from './CompassDisplay'
import { ElevenLabsClient } from 'elevenlabs'
import Link from 'next/link'
import { commandStore } from '@/lib/commandStore'
import { checkApiKeys } from '@/lib/api-keys'
import { config } from '@/lib/config'

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

// Naval command patterns and configurations
const NAVAL_PATTERNS = {
  RUDDER: {
    ANGLES: {
      HARD: 35,
      FULL: 30,
      STANDARD: 15,
      HALF: 10,
      SLIGHT: 5
    },
    COMMANDS: {
      AMIDSHIPS: /\b(?:rudder\s+)?amidships\b/i,
      MEET_HER: /\bmeet\s+her\b/i,
      SHIFT: /\bshift\s+(?:your\s+)?rudder\b/i,
      EASE: /\b(?:ease|check)\s+(?:your\s+)?(?:swing|turn)\b/i
    }
  },
  SPEED: {
    AHEAD: {
      'emergency flank': 110,
      'flank': 100,
      'full': 90,
      'standard': 75,
      'two thirds': 67,
      'half': 50,
      'one third': 33,
      'slow': 25,
      'dead slow': 10,
      'stop': 0
    },
    ASTERN: {
      'emergency full': -100,
      'full': -75,
      'half': -50,
      'slow': -25,
      'stop': 0
    }
  },
  COURSE: {
    CARDINAL: {
      'north': 0,
      'northeast': 45,
      'east': 90,
      'southeast': 135,
      'south': 180,
      'southwest': 225,
      'west': 270,
      'northwest': 315
    },
    POINTS: {
      'point': 11.25 // One point = 11.25 degrees
    }
  }
}

// Add this constant with the example commands
const EXAMPLE_COMMANDS = [
  "Helm, right 15 degrees rudder, steady on course zero niner zero",
  "Helm, all ahead two-thirds, come left to heading one eight zero",
  "Helm, rudder amidships, all ahead full, steady as she goes",
  "Helm, left standard rudder, reduce speed to one-third, steady on course two seven zero",
  "Helm, all stop, come right to heading three six zero",
  "Helm, back emergency full, steady as she goes",
  "Helm, right 10 degrees rudder, all ahead slow, steady on course zero four five",
  "Helm, left 30 degrees rudder, steady on course one four five",
  "Helm, all astern half, maintain heading two one zero",
  "Helm, no more than 10 degrees rudder, hold course at zero niner zero"
]

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
  const [missingKeys, setMissingKeys] = useState({ gemini: false, elevenLabs: false })
  const [showExamples, setShowExamples] = useState(false)

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    error,
    setTranscript 
  } = useVoiceRecognition()
  const { toast } = useToast()

  useEffect(() => {
    const checkKeys = () => {
      const keyStatus = checkApiKeys()
      setMissingKeys({
        gemini: !keyStatus.gemini,
        elevenLabs: !keyStatus.elevenLabs
      })
    }
    
    checkKeys()
    window.addEventListener('storage', checkKeys)
    return () => window.removeEventListener('storage', checkKeys)
  }, [])

  const playAudioResponse = useCallback(async (text: string) => {
    if (isMuted) return true

    try {
      // Use ElevenLabs if API key is available
      if (config.elevenlabs.apiKey) {
        console.log('Using ElevenLabs with voice ID:', config.elevenlabs.voiceId);
        console.log('Using ElevenLabs model:', config.elevenlabs.modelId);
        
        // Create an audio context first
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': config.elevenlabs.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: config.elevenlabs.modelId
          }),
        });

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioBuffer = await audioBlob.arrayBuffer();
        const audioSource = audioContext.createBufferSource();
        
        // Convert array buffer to audio buffer
        const decodedBuffer = await audioContext.decodeAudioData(audioBuffer);
        audioSource.buffer = decodedBuffer;
        audioSource.connect(audioContext.destination);
        
        return new Promise((resolve, reject) => {
          audioSource.addEventListener('ended', () => resolve(true));
          // Resume the audio context before playing
          audioContext.resume().then(() => {
            audioSource.start(0);
          }).catch(reject);
        });
      } else {
        // Fallback to browser speech synthesis with improved settings
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;  // Slightly slower
          utterance.pitch = 1.1;  // Slightly higher pitch
          utterance.volume = 1.0;
          
          // Try to use a more natural voice if available
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(voice => 
            voice.name.includes('Daniel') || 
            voice.name.includes('Premium') ||
            voice.name.includes('Natural')
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          
          utterance.onend = () => resolve(true);
          window.speechSynthesis.speak(utterance);
        });
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      toast({
        title: "Audio Error",
        description: "Failed to play audio response",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  }, [isMuted, toast])

  // Effect to handle transcript updates
  useEffect(() => {
    if (transcript && !processingCommand) {
      handleCommand(transcript)
    }
  }, [transcript])

  const handleCommand = useCallback(async (command: string) => {
    if (processingCommand) return
    
    setProcessingCommand(true)
    try {
      console.log('Processing transcript:', command)
      
      // Get the API key
      const geminiKey = localStorage.getItem('geminiApiKey') || process.env.NEXT_PUBLIC_GEMINI_API_KEY

      // Send command to LLM endpoint
      const response = await fetch('/api/process-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': geminiKey || '',
        },
        body: JSON.stringify({
          command,
          currentState: shipState
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process command')
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Use the corrected command in the UI
      const correctedCommand = result.correctedCommand || command
      setLastCommand(correctedCommand)
      
      // Add to command log
      setCommandLog(prev => [...prev, correctedCommand])
      
      // Store in command history with response
      const helmResponse = `${correctedCommand.replace(/^helm,?\s*/i, '')}, aye aye`
      commandStore.addCommand(correctedCommand, helmResponse, result.statusReport || '')

      // Update ship state with LLM-provided updates
      if (result.stateUpdates) {
        const newShipState = { ...shipState }
        
        // Log the current state and updates
        console.log('Current ship state:', shipState)
        console.log('State updates received:', result.stateUpdates)
        
        if (result.stateUpdates.rudder !== null) {
          newShipState.rudder = result.stateUpdates.rudder
        }
        if (result.stateUpdates.course !== null) {
          console.log('NavalHelmInterface - Updating course from:', shipState.course, 'to:', result.stateUpdates.course)
          // Normalize course to 0-360 range
          const normalizedCourse = ((Number(result.stateUpdates.course) % 360) + 360) % 360
          newShipState.course = normalizedCourse
        }
        if (result.stateUpdates.speed !== null) {
          newShipState.speed = result.stateUpdates.speed
        }
        
        console.log('NavalHelmInterface - Setting new ship state:', newShipState)
        setShipState(newShipState)
      }

      // Set screen response
      setScreenResponse(result.statusReport || '')

      // Reset processing state before playing audio
      setProcessingCommand(false)
      setTranscript('') // Clear the transcript after processing

      // Play audio response
      if (result.statusReport) {
        await playAudioResponse(helmResponse)
      }

    } catch (error) {
      console.error('Error processing command:', error)
      toast({
        title: "Command Error",
        description: error instanceof Error ? error.message : "Failed to process command",
        variant: "destructive",
      })
      // Make sure to reset processing state on error
      setProcessingCommand(false)
      setTranscript('')
    }
  }, [shipState, playAudioResponse, toast, setTranscript])

  const handleExampleClick = useCallback((example: string) => {
    if (!processingCommand) {
      handleCommand(example)
    }
  }, [handleCommand, processingCommand])

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
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold flex justify-between items-center text-foreground">
              Voice Control
              <div className="flex items-center gap-2">
                <Radio className={`h-4 w-4 ${isListening ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className={`text-xs sm:text-sm font-normal ${isListening ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'} px-2 sm:px-3 py-1 rounded`}>
                  {isListening ? 'Listening...' : 'Ready'}
                </span>
              </div>
            </CardTitle>

            <div className="bg-card p-4 rounded-lg border border-border mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Engine Telegraph</h3>
                {shipState.speed !== 0 && (
                  <div className="animate-pulse h-2 w-2 rounded-full bg-green-500" />
                )}
              </div>

              <div className="mb-4 p-3 rounded bg-gray-900/50 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Order:</span>
                  {shipState.speed > 0 && <ArrowUp className="h-4 w-4 text-green-500" />}
                  {shipState.speed < 0 && <ArrowDown className="h-4 w-4 text-green-500" />}
                  {shipState.speed === 0 && <Pause className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="font-mono text-lg font-bold text-green-500">
                  {shipState.speed > 0 ? 'AHEAD' : shipState.speed < 0 ? 'ASTERN' : 'STOP'} 
                  {shipState.speed !== 0 && ` ${Math.abs(shipState.speed)}`}
                </div>
              </div>

              <div className="p-3 rounded bg-gray-900/50 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Answering:</span>
                  {shipState.speed !== 0 ? (
                    <Gauge className={`h-4 w-4 text-yellow-500 ${shipState.speed !== 0 ? 'animate-spin-slow' : ''}`} />
                  ) : (
                    <Anchor className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="font-mono text-lg font-bold text-yellow-500">
                  {shipState.speed > 0 ? 'AHEAD' : shipState.speed < 0 ? 'ASTERN' : 'STOP'} 
                  {shipState.speed !== 0 && ` ${Math.abs(shipState.speed)}`}
                </div>
              </div>
            </div>

            <div className="bg-card p-3 sm:p-4 rounded-lg border border-border mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Navigation2 
                  className={`h-5 w-5 text-foreground ${shipState.rudder !== 0 ? 'animate-pulse' : ''}`}
                  style={{ transform: `rotate(${shipState.rudder}deg)` }}
                />
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Rudder Angle</h3>
              </div>

              <div className="relative">
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.abs(shipState.rudder)}° {shipState.rudder < 0 ? 'PORT' : shipState.rudder > 0 ? 'STARBOARD' : ''}
                </span>

                <div className="flex justify-between text-xs mt-4 mb-2 px-1">
                  <span className="text-muted-foreground">35</span>
                  <span className="text-muted-foreground">30</span>
                  <span className="text-muted-foreground">20</span>
                  <span className="text-muted-foreground">10</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">10</span>
                  <span className="text-muted-foreground">20</span>
                  <span className="text-muted-foreground">30</span>
                  <span className="text-muted-foreground">35</span>
                </div>

                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 bg-blue-500 transition-all duration-500"
                    style={{ 
                      left: shipState.rudder <= 0 ? '50%' : `${50 + (shipState.rudder * 1.43)}%`,
                      right: shipState.rudder >= 0 ? '50%' : `${50 + (Math.abs(shipState.rudder) * 1.43)}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between mt-2">
                  <span className="font-medium text-muted-foreground">PORT</span>
                  <span className="font-medium text-muted-foreground">STBD</span>
                </div>

                <div className="text-center mt-1 font-mono text-sm text-foreground font-medium">
                  {shipState.rudder === 0 ? 'MIDSHIPS' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex justify-between items-center">
              Command Log
              <Link href="/command-history">
                <Button variant="outline" size="sm" className="border-border flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </Button>
              </Link>
            </CardTitle>

            <div className="font-mono text-sm mt-4">
              {commandLog.length > 0 && (
                <div className="relative flex flex-col space-y-3 p-4 rounded-lg bg-card border border-border shadow-sm">
                  {/* Command */}
                  <div className="flex items-start space-x-2 pb-2 border-b border-border">
                    <div className="mt-1">
                      <Radio className="h-3 w-3" />
                    </div>
                    <span className="text-foreground break-words flex-1 font-medium">{commandLog[0]}</span>
                  </div>

                  {/* Response */}
                  <div className={`flex items-start space-x-2 pb-2 ${screenResponse ? 'border-b border-border' : ''}`}>
                    <div className="mt-1">
                      <Radio className="h-3 w-3" />
                    </div>
                    <span className="text-muted-foreground break-words flex-1">
                      {processingCommand ? (
                        <span className="animate-pulse">Processing command...</span>
                      ) : (
                        screenResponse || 'Awaiting response...'
                      )}
                    </span>
                  </div>

                  {/* Transcript */}
                  {transcript && (
                    <div className="flex items-start space-x-2">
                      <div className="mt-1">
                        <Radio className="h-3 w-3" />
                      </div>
                      <span className="text-muted-foreground break-words flex-1 italic">
                        {transcript}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">Compass</CardTitle>
            <div className="mt-4">
              <CompassDisplay course={shipState.course} />
            </div>
            <div className="mt-4 font-mono text-center">
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {shipState.course}°
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                TRUE HEADING
              </div>
            </div>
          </CardContent>
        </Card>

        <ShipStatus {...shipState} />
      </div>
    </div>
  )
}

// Helper function to convert speed value to text
function getSpeedText(speed: number): string {
  if (speed >= 100) return 'FLANK'
  if (speed >= 90) return 'FULL'
  if (speed >= 75) return 'STANDARD'
  if (speed >= 67) return 'TWO THIRDS'
  if (speed >= 50) return 'HALF'
  if (speed >= 33) return 'ONE THIRD'
  if (speed >= 25) return 'SLOW'
  if (speed >= 10) return 'DEAD SLOW'
  return 'STOP'
}

// Helper function to get cardinal direction
function getCardinalDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

