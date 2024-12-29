import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = 'KdK3sZnIcumA6iSIe9KG'

const DEFAULT_RESPONSES = [
  "Left 10 degrees rudder, aye aye",
  "Right standard rudder, steady course north, aye aye",
  "All ahead full, aye aye",
  "Rudder amidships, aye aye",
  "Left 20 degrees rudder, all ahead two thirds, aye aye"
]

export default function VoiceTest() {
  const [settings, setSettings] = useState({
    stability: 0.5,
    similarity_boost: 0.75,
    use_speaker_boost: true,
  })

  const [voicePrompt, setVoicePrompt] = useState(
    "[Voice: You are a professional naval helmsman with years of experience. Speak with a clear, confident, and authoritative tone that reflects maritime discipline. Your responses should be crisp, precise, and delivered with proper naval inflection and timing. Maintain a steady, measured pace that conveys both competence and respect for naval tradition.]"
  )
  
  const [customText, setCustomText] = useState("")
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
        model_id: 'eleven_flash_v2_5',
        voice_settings: settings,
        voice_settings_overrides: usePrompt ? {
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          use_speaker_boost: settings.use_speaker_boost,
          speaking_rate: 0.95,
          system_prompt: voicePrompt
        } : undefined
      }

      console.log('ElevenLabs request:', {
        text,
        usePrompt,
        settings: requestBody.voice_settings,
        overrides: requestBody.voice_settings_overrides
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
        {/* Voice Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Stability ({settings.stability})
              </label>
              <Slider 
                value={[settings.stability]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([value]) => setSettings(s => ({ ...s, stability: value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Similarity Boost ({settings.similarity_boost})
              </label>
              <Slider 
                value={[settings.similarity_boost]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([value]) => setSettings(s => ({ ...s, similarity_boost: value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="speaker-boost"
                type="checkbox"
                title="Toggle speaker boost"
                aria-label="Use speaker boost"
                checked={settings.use_speaker_boost}
                onChange={(e) => setSettings(s => ({ ...s, use_speaker_boost: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="speaker-boost" className="text-sm font-medium">Use Speaker Boost</label>
            </div>
          </CardContent>
        </Card>

        {/* Voice Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={voicePrompt}
              onChange={(e) => setVoicePrompt(e.target.value)}
              rows={4}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Test Responses */}
        <Card>
          <CardHeader>
            <CardTitle>Test Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {DEFAULT_RESPONSES.map((response, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Button 
                  onClick={() => playAudio(response, true)}
                  disabled={isPlaying}
                  variant="outline"
                  className="min-w-32 bg-green-900/20 hover:bg-green-900/30"
                >
                  Play (With Prompt)
                </Button>
                <Button 
                  onClick={() => playAudio(response, false)}
                  disabled={isPlaying}
                  variant="outline"
                  className="min-w-32 bg-gray-700"
                >
                  Play (No Prompt)
                </Button>
                <span className="font-mono">{response}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Custom Text */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter custom text to test..."
              className="w-full"
            />
            <div className="flex space-x-2">
              <Button 
                onClick={() => playAudio(customText, true)}
                disabled={isPlaying || !customText}
                className="min-w-32 bg-green-900/20 hover:bg-green-900/30"
              >
                Play (With Prompt)
              </Button>
              <Button 
                onClick={() => playAudio(customText, false)}
                disabled={isPlaying || !customText}
                variant="outline"
                className="min-w-32"
              >
                Play (No Prompt)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 