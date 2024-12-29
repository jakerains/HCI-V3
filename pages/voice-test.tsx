import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID
const ELEVENLABS_MODEL_ID = process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID

const DEFAULT_RESPONSES = [
  "Left 10 degrees rudder, aye aye",
  "Right standard rudder, steady course north, aye aye",
  "All ahead full, aye aye",
  "Rudder amidships, aye aye",
  "Left 20 degrees rudder, all ahead two thirds, aye aye"
]

export default function VoiceTest() {
  const [customText, setCustomText] = useState('')
  const [voicePrompt, setVoicePrompt] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)

  const playAudio = async (text: string, usePrompt: boolean = true) => {
    if (isPlaying) return
    setIsPlaying(true)

    try {
      if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not found')
      }
      
      const requestBody = {
        text: text,
        model_id: ELEVENLABS_MODEL_ID
      }

      console.log('ElevenLabs request:', {
        text,
        usePrompt
      })
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        setIsPlaying(false)
      }
      
      await audio.play()
    } catch (error) {
      console.error('Audio playback error:', error)
      setIsPlaying(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">ElevenLabs Voice Test</h1>
      
      <div className="grid gap-6">
        {/* Voice Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={voicePrompt}
              onChange={(e) => setVoicePrompt(e.target.value)}
              placeholder="Enter a voice prompt..."
              className="mb-4"
            />
          </CardContent>
        </Card>

        {/* Custom Text */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter text to speak..."
              className="mb-4"
            />
            <Button 
              onClick={() => playAudio(customText)}
              disabled={isPlaying || !customText}
            >
              Speak Custom Text
            </Button>
          </CardContent>
        </Card>

        {/* Default Responses */}
        <Card>
          <CardHeader>
            <CardTitle>Default Responses</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {DEFAULT_RESPONSES.map((text, index) => (
              <Button
                key={index}
                onClick={() => playAudio(text)}
                disabled={isPlaying}
                variant="outline"
              >
                {text}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 