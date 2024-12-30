'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Mic, MicOff, Volume2, VolumeX, ArrowUp, ArrowDown, Pause, Gauge, Anchor, Ship, Radio, History, Navigation2, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { useToast } from "./ui/use-toast"
import ShipStatus from './ShipStatus'
import CommandLog from './CommandLog'
import CompassDisplay from './CompassDisplay'
import { ElevenLabsClient } from 'elevenlabs'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeSwitcher } from './ThemeSwitcher'
import Link from 'next/link'
import { commandStore } from '@/lib/commandStore'

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

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID
const ELEVENLABS_MODEL_ID = process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID

export default function NavalHelmInterface() {
  const { theme } = useTheme()
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
        console.log('Using ElevenLabs model:', ELEVENLABS_MODEL_ID)
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5'
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
        // Fallback to browser speech synthesis with improved settings
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 0.95  // Slightly slower
          utterance.pitch = 1.1  // Slightly higher pitch
          utterance.volume = 1.0
          
          // Try to use a more natural voice if available
          const voices = window.speechSynthesis.getVoices()
          const preferredVoice = voices.find(voice => 
            voice.name.includes('Daniel') || 
            voice.name.includes('Premium') ||
            voice.name.includes('Natural')
          )
          if (preferredVoice) {
            utterance.voice = preferredVoice
          }
          
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
      
      // Send command to LLM endpoint
      const response = await fetch('/api/process-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      setCommandLog(prev => [correctedCommand, ...prev].slice(0, 5))

      // Update ship state with LLM-provided updates
      const newShipState = { ...shipState }
      if (result.stateUpdates) {
        if (result.stateUpdates.rudder !== null) {
          newShipState.rudder = result.stateUpdates.rudder
        }
        if (result.stateUpdates.course !== null) {
          newShipState.course = result.stateUpdates.course
        }
        if (result.stateUpdates.speed !== null) {
          newShipState.speed = result.stateUpdates.speed
        }
        setShipState(newShipState)
      }

      setScreenResponse(result.statusReport)
      
      // Store command in history
      const helmResponse = `${correctedCommand.replace(/^helm,?\s*/i, '')}, aye aye`
      commandStore.addCommand(correctedCommand, helmResponse, result.statusReport)
      
      // Play audio response
      console.log('Sending to ElevenLabs:', helmResponse)
      await playAudioResponse(helmResponse)

    } catch (error) {
      console.error('Command processing error:', error)
      toast({
        title: "Command Error",
        description: error instanceof Error ? error.message : "Failed to process command",
        variant: "destructive",
      })
    } finally {
      setProcessingCommand(false)
    }
  }, [playAudioResponse, shipState, toast])

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
    <div className={`w-full max-w-6xl mx-6 my-6 p-4 sm:p-6 ${theme.name === "Naval Dark" ? "bg-[hsl(222,23%,10%)]" : "bg-[hsl(300,0%,88%)]"} ${theme.text.primary} rounded-lg shadow-2xl relative`}>
      <ThemeSwitcher />
      <h1 className={`${theme.fonts.display} text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 ${theme.text.primary}`}>
        Naval Ship's Helm Command Interface
      </h1>
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Ship Status - Left Column */}
        <div className="lg:col-span-8 grid grid-rows-[auto_1fr] gap-4 sm:gap-6">
          <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-lg sm:text-xl font-semibold flex justify-between items-center ${theme.text.primary}`}>
                <div className="flex items-center gap-2">
                  <Ship className="h-5 w-5" />
                  Ship Status
                </div>
                <div className="flex items-center gap-2">
                  <Radio className={`h-4 w-4 ${isListening ? theme.status.listening : theme.text.muted}`} />
                  <span className={`text-xs sm:text-sm font-normal ${isListening ? theme.status.listening : theme.status.ready} px-2 sm:px-3 py-1 rounded`}>
                    {isListening ? 'Listening...' : 'Ready'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="min-w-[200px]">
                  <ShipStatus {...shipState} />
                </div>
                <div className="flex flex-col space-y-4">
                  {/* Engine Telegraph Display */}
                  <div className={`${theme.colors.cardBackground} p-4 rounded-lg border ${theme.colors.cardBorder}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-base sm:text-lg font-semibold ${theme.text.primary}`}>Engine Telegraph</h3>
                      {shipState.speed !== 0 && (
                        <div className={`animate-pulse h-2 w-2 rounded-full ${theme.indicators.speed}`} />
                      )}
                    </div>
                    
                    {/* Order Section */}
                    <div className={`mb-4 p-3 rounded bg-gray-900/50 border ${theme.colors.cardBorder}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs uppercase tracking-wider ${theme.text.muted}`}>Order:</span>
                        {shipState.speed > 0 ? (
                          <ArrowUp className={`h-4 w-4 ${theme.indicators.speed}`} />
                        ) : shipState.speed < 0 ? (
                          <ArrowDown className={`h-4 w-4 ${theme.indicators.speed}`} />
                        ) : (
                          <Pause className={`h-4 w-4 ${theme.text.muted}`} />
                        )}
                      </div>
                      <div className={`${theme.fonts.mono} text-lg font-bold ${theme.indicators.speed}`}>
                        {shipState.speed > 0 
                          ? `ALL AHEAD ${getSpeedText(shipState.speed)}`
                          : shipState.speed < 0 
                            ? `ALL ASTERN ${getSpeedText(Math.abs(shipState.speed))}`
                            : 'ALL STOP'}
                      </div>
                    </div>
                    
                    {/* Answering Section */}
                    <div className={`p-3 rounded bg-gray-900/50 border ${theme.colors.cardBorder}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs uppercase tracking-wider ${theme.text.muted}`}>Answering:</span>
                        {shipState.speed !== 0 ? (
                          <Gauge className={`h-4 w-4 ${theme.indicators.course} ${shipState.speed !== 0 ? 'animate-spin-slow' : ''}`} />
                        ) : (
                          <Anchor className={`h-4 w-4 ${theme.indicators.course}`} />
                        )}
                      </div>
                      <div className={`${theme.fonts.mono} text-lg font-bold ${theme.indicators.course}`}>
                        {shipState.speed !== 0 ? 'ENGINES ANSWERING' : 'ENGINES STOPPED'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Rudder Angle Display */}
                  <div className={`${theme.colors.cardBackground} p-3 sm:p-4 rounded-lg border ${theme.colors.cardBorder}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Navigation2 className={`h-5 w-5 ${theme.text.primary} ${shipState.rudder !== 0 ? 'animate-pulse' : ''}`} 
                          style={{ transform: `rotate(${shipState.rudder}deg)` }}
                        />
                        <h3 className={`text-base sm:text-lg font-semibold ${theme.text.primary}`}>Rudder Angle</h3>
                      </div>
                      {shipState.rudder !== 0 && (
                        <span className={`text-xs font-medium ${theme.text.muted}`}>
                          {shipState.rudder < 0 ? 'Turning Port' : 'Turning Stbd'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      {/* Angle markers */}
                      <div className="flex justify-between px-2 text-[10px] font-mono">
                        <span className={theme.text.muted}>35</span>
                        <span className={theme.text.muted}>30</span>
                        <span className={theme.text.muted}>20</span>
                        <span className={theme.text.muted}>10</span>
                        <span className={theme.text.muted}>|</span>
                        <span className={theme.text.muted}>10</span>
                        <span className={theme.text.muted}>20</span>
                        <span className={theme.text.muted}>30</span>
                        <span className={theme.text.muted}>35</span>
                      </div>

                      {/* Rudder bar and indicator */}
                      <div className={`relative h-2 ${theme.compass.background} rounded-full overflow-hidden`}>
                        {/* Background tick marks */}
                        <div className="absolute inset-0 flex justify-between px-2">
                          {[-35, -30, -20, -10, 0, 10, 20, 30, 35].map((angle) => (
                            <div key={angle} className="h-full w-0.5 bg-gray-700/30" />
                          ))}
                        </div>

                        {/* Active bar */}
                        <div 
                          className={`absolute top-0 bottom-0 ${theme.indicators.rudder} transition-all duration-500`}
                          style={{
                            left: '50%',
                            width: `${Math.abs(shipState.rudder) / 35 * 50}%`,
                            transform: `translateX(${shipState.rudder >= 0 ? '0' : '-100%'})`,
                          }}
                        />
                        
                        {/* Center line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-500" />
                      </div>

                      {/* Port/Stbd labels */}
                      <div className="flex justify-between px-2 text-xs">
                        <span className={`font-medium ${theme.text.secondary}`}>PORT</span>
                        <span className={`font-medium ${theme.text.secondary}`}>STBD</span>
                      </div>

                      {/* Current angle readout */}
                      <div className={`text-center mt-1 ${theme.fonts.mono} text-sm ${theme.text.primary} font-medium`}>
                        {Math.abs(shipState.rudder)}° {shipState.rudder < 0 ? 'PORT' : shipState.rudder > 0 ? 'STBD' : 'AMIDSHIPS'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Command Log */}
          <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-lg sm:text-xl font-semibold ${theme.text.primary} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Latest Command
                </div>
                <Link href="/command-history">
                  <Button variant="outline" size="sm" className={`${theme.colors.cardBorder} flex items-center gap-2`}>
                    <Navigation2 className="h-4 w-4" />
                    View History
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`${theme.fonts.mono} text-sm`}>
                {commandLog[0] && (
                  <div className={`relative flex flex-col space-y-3 p-4 rounded-lg ${theme.colors.cardBackground} border ${theme.colors.cardBorder} shadow-sm`}>
                    {/* CO Command */}
                    <div className={`flex items-start space-x-2 pb-2 border-b ${theme.colors.cardBorder}`}>
                      <span className={`shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400`}>
                        CO
                      </span>
                      <span className={`${theme.text.primary} break-words flex-1 font-medium`}>{commandLog[0]}</span>
                    </div>
                    
                    {/* Helm Response */}
                    <div className={`flex items-start space-x-2 pb-2 ${screenResponse ? `border-b ${theme.colors.cardBorder}` : ''}`}>
                      <span className={`shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400`}>
                        HELM
                      </span>
                      <span className={`${theme.text.secondary} break-words flex-1`}>
                        {commandLog[0].replace(/^helm,?\s*/i, '')}, aye aye
                      </span>
                    </div>
                    
                    {/* Status Update */}
                    {screenResponse && (
                      <div className="flex items-start space-x-2">
                        <span className={`shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400`}>
                          STATUS
                        </span>
                        <span className={`${theme.text.muted} break-words flex-1 italic`}>
                          {screenResponse}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Compass and Controls */}
        <div className="lg:col-span-4 grid grid-rows-[auto_1fr] gap-4 sm:gap-6">
          <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-lg sm:text-xl font-semibold ${theme.text.primary}`}>Compass</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[300px] mx-auto">
                  <CompassDisplay course={shipState.course} />
                </div>
                <div className={`mt-4 ${theme.fonts.mono} text-center`}>
                  <div className={`text-xl sm:text-2xl font-bold ${theme.text.primary}`}>
                    {shipState.course.toFixed(1)}°
                  </div>
                  <div className={`text-xs sm:text-sm ${theme.text.muted}`}>
                    {getCardinalDirection(shipState.course)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-lg sm:text-xl font-semibold ${theme.text.primary}`}>Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <Button 
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  onMouseLeave={stopListening}
                  variant={isListening ? "destructive" : "default"} 
                  size="lg"
                  className="w-full text-sm sm:text-base"
                >
                  {isListening ? <MicOff className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
                  {isListening ? 'Release to Process' : 'Press and Hold to Speak'}
                </Button>
                <Button 
                  onClick={toggleMute} 
                  variant="secondary" 
                  size="lg"
                  className={`w-full text-sm sm:text-base ${theme.colors.cardBackground} hover:opacity-80`}
                >
                  {isMuted ? <VolumeX className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
                  {isMuted ? 'Unmute Responses' : 'Mute Responses'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Voice Control Section */}
          <div className="flex flex-col space-y-4">
            <div className={`${theme.colors.cardBackground} p-4 rounded-lg border ${theme.colors.cardBorder}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className={`h-5 w-5 ${isListening ? theme.status.listening : theme.text.primary}`} />
                  <h3 className={`text-base sm:text-lg font-semibold ${theme.text.primary}`}>Voice Control</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMute}
                    className={`${theme.colors.cardBorder} hover:${theme.colors.cardBorder}`}
                  >
                    {isMuted ? (
                      <VolumeX className={`h-4 w-4 ${theme.text.muted}`} />
                    ) : (
                      <Volume2 className={`h-4 w-4 ${theme.text.primary}`} />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleListening}
                    className={`${theme.colors.cardBorder} hover:${theme.colors.cardBorder} ${
                      isListening ? 'bg-green-500/10' : ''
                    }`}
                  >
                    {isListening ? (
                      <Mic className="h-4 w-4 text-green-500" />
                    ) : (
                      <MicOff className={`h-4 w-4 ${theme.text.muted}`} />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Transcript display */}
              {transcript && (
                <div className={`p-3 rounded bg-gray-900/50 border ${theme.colors.cardBorder}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs uppercase tracking-wider ${theme.text.muted}`}>Transcript:</span>
                    <div className={`animate-pulse h-1.5 w-1.5 rounded-full ${theme.status.listening}`} />
                  </div>
                  <p className={`${theme.fonts.mono} ${theme.text.primary}`}>{transcript}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Version number */}
      <div className={`text-[10px] ${theme.text.muted} text-center mt-4`}>
        v0.2.0
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

