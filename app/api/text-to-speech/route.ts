import { NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function POST(request: Request) {
  const { text } = await request.json()
  
  // Get API key from request headers or environment variable
  const apiKey = request.headers.get('x-elevenlabs-key') || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.elevenlabs.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: config.elevenlabs.modelId
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (error) {
    console.error('Error generating speech:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate speech'
    }, { status: 500 })
  }
}

