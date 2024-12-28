import { NextResponse } from 'next/server'
import { GroqClient } from 'groq-sdk'

if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID) {
  throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID environment variable')
}

export async function POST(request: Request) {
  try {
    // Initialize Groq client inside the handler
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY environment variable' },
        { status: 500 }
      )
    }

    const groq = new GroqClient({
      apiKey: process.env.GROQ_API_KEY,
    })

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { command } = body

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    console.log('Processing command:', command)

    try {
      // First, correct any transcription errors
      const correctionCompletion = await groq.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'You are a naval command correction system. Your job is to correct common transcription errors in naval helm commands. For example:\n- "love" should be "left"\n- "write" should be "right"\n- "hell" should be "helm"\n- "study" should be "steady"\nOnly fix actual transcription errors - do not modify valid commands. Return only the corrected command text with no explanation.' 
          },
          { 
            role: 'user', 
            content: command 
          }
        ],
        model: 'llama-3.1-8b-instant',
        max_tokens: 50,
        temperature: 0.1,
      })

      if (!correctionCompletion.choices?.[0]?.message?.content) {
        throw new Error('No correction response generated')
      }

      const correctedCommand = correctionCompletion.choices[0].message.content.trim()
      console.log('Corrected command:', correctedCommand)

      // Now process the corrected command
      const responseCompletion = await groq.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'You are a naval ship\'s helm. When given a command, respond by first repeating the command (excluding the initial "Helm" if present), then say "helm", then "aye". For example, if given "Helm, left 10 degree rudder, steady course 130" respond with "left 10 degree rudder, steady course 130, helm, aye". Never add any other words or details.' 
          },
          { 
            role: 'user', 
            content: correctedCommand 
          }
        ],
        model: 'llama-3.1-8b-instant',
        max_tokens: 50,
        temperature: 0.1,
      })

      if (!responseCompletion.choices?.[0]?.message?.content) {
        throw new Error('No response generated')
      }

      const aiResponse = responseCompletion.choices[0].message.content
      console.log('AI Response:', aiResponse)

      // Generate speech for the response
      const speechResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiResponse,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      })

      if (!speechResponse.ok) {
        throw new Error('Failed to generate speech')
      }

      const audioBuffer = await speechResponse.arrayBuffer()
      const audioBase64 = Buffer.from(audioBuffer).toString('base64')

      return NextResponse.json({ 
        response: aiResponse,
        audio: audioBase64,
        correctedCommand
      })
    } catch (error) {
      console.error('Error processing command:', error)
      return NextResponse.json(
        { error: 'Failed to process command', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

