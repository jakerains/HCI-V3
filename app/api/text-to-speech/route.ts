import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { text } = await request.json()
  
  // Get credentials from request headers
  const apiKey = request.headers.get('x-elevenlabs-key') || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
  const voiceId = request.headers.get('x-elevenlabs-voice-id') || process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID
  const modelId = request.headers.get('x-elevenlabs-model-id') || process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID || 'eleven_flash_v2'

  if (!apiKey || !voiceId) {
    return NextResponse.json({ error: 'Missing API key or Voice ID' }, { status: 500 })
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: modelId
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

