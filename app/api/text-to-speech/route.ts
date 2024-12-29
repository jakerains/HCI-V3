import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { text } = await request.json()
  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID
  const modelId = process.env.ELEVENLABS_MODEL_ID

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
      throw new Error('Failed to generate speech')
    }

    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (error) {
    console.error('Error generating speech:', error)
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 })
  }
}

