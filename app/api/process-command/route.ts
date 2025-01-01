import { NextResponse } from 'next/server'
import { Groq } from 'groq-sdk'

// Naval command patterns and configurations
const NAVAL_PATTERNS = {
  RUDDER: {
    ANGLES: {
      HARD: 35,
      FULL: 30,
      STANDARD: 15,
      HALF: 10,
      SLIGHT: 5
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
  }
}

// Naval number pronunciation patterns
const NAVAL_NUMBERS = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'niner'
}

function formatNavalCourse(course: number): string {
  // Convert a number like 090 to "zero niner zero"
  return course.toString().padStart(3, '0').split('')
    .map(digit => {
      const num = parseInt(digit) as keyof typeof NAVAL_NUMBERS
      return NAVAL_NUMBERS[num]
    })
    .join(' ')
}

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY
const GROQ_MODEL_ID = process.env.GROQ_MODEL_ID

export async function POST(request: Request) {
  try {
    // Initialize Groq client inside the handler
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) {
      console.error('Missing NEXT_PUBLIC_GROQ_API_KEY environment variable')
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY environment variable' },
        { status: 500 }
      )
    }

    if (!process.env.GROQ_MODEL_ID) {
      console.error('Missing GROQ_MODEL_ID environment variable')
      return NextResponse.json(
        { error: 'Missing GROQ_MODEL_ID environment variable' },
        { status: 500 }
      )
    }

    const client = new Groq({
      apiKey: GROQ_API_KEY,
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

    const { command, currentState } = body

    if (!command) {
      console.error('Command is required but was not provided')
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    console.log('Processing command:', command)
    console.log('Current state:', currentState)

    try {
      // First, correct any transcription errors and normalize the command format
      console.log('Sending command for correction:', command)
      const correctionCompletion = await client.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: `You are a naval command correction system. Return ONLY the corrected command with no explanations, notes, or additional text.

Common fixes:
- "home/hell/help/held" → "helm"
- "love" → "left"
- "write" → "right"
- Numbers: 0="zero", 1="one", 2="two", 3="three", 4="four", 5="five", 6="six", 7="seven", 8="eight", 9="niner"

Format:
1. Start with "Helm"
2. Rudder: "Helm, [left/right] [X] degrees rudder"
3. Course: "steady on course" with naval numbers
4. Speed: Optional, do not add if not in original command

CRITICAL: Return ONLY the corrected command text. No explanations. No notes. No suggestions.`
          },
          { role: 'user', content: command }
        ],
        model: process.env.GROQ_MODEL_ID,
        max_tokens: 100,
        temperature: 0.1,
        top_p: 0.9,
        response_format: { type: "text" }
      })

      if (!correctionCompletion.choices?.[0]?.message?.content) {
        console.error('No correction response generated')
        throw new Error('No correction response generated')
      }

      const correctedCommand = correctionCompletion.choices[0].message.content.trim()
      console.log('Corrected command:', correctedCommand)

      // Now interpret the command and generate state updates
      console.log('Sending corrected command for interpretation:', correctedCommand)
      const interpretationCompletion = await client.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: `You are a naval command interpreter. Return ONLY a JSON object with no explanations or additional text.

Current ship state: ${JSON.stringify(currentState)}

Rules:
1. Rudder: -35 to +35 (negative=left)
2. Speed: -100 to +110 (negative=astern)
3. Course: 0-359

CRITICAL: Return ONLY this JSON format with no explanations or notes:
{
  "stateUpdates": {
    "rudder": number | null,
    "course": number | null,
    "speed": null  // Only set if speed command is present
  },
  "helmAcknowledgment": string,  // Just the command acknowledgment
  "statusReport": string         // Brief status only
}`
          },
          { role: 'user', content: correctedCommand }
        ],
        model: process.env.GROQ_MODEL_ID,
        max_tokens: 250,
        temperature: 0.1,
        top_p: 0.9,
        response_format: { type: "json_object" }
      })

      if (!interpretationCompletion.choices?.[0]?.message?.content) {
        console.error('No interpretation response generated')
        throw new Error('No interpretation response generated')
      }

      let interpretation
      try {
        const rawResponse = interpretationCompletion.choices[0].message.content.trim()
        console.log('Raw interpretation response:', rawResponse)
        
        // Try to extract JSON if the response contains explanatory text
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          interpretation = JSON.parse(jsonMatch[0])
        } else {
          interpretation = JSON.parse(rawResponse)
        }
      } catch (error) {
        console.error('Error parsing interpretation response:', error)
        console.error('Raw response:', interpretationCompletion.choices[0].message.content)
        throw new Error('Invalid interpretation response format')
      }

      console.log('Parsed interpretation:', interpretation)

      // Validate the interpretation structure
      if (!interpretation.stateUpdates || !interpretation.helmAcknowledgment || !interpretation.statusReport) {
        console.error('Invalid interpretation structure:', interpretation)
        throw new Error('Invalid interpretation structure')
      }

      // Format the course number in the response if it exists
      if (interpretation.stateUpdates?.course !== null) {
        const course = interpretation.stateUpdates.course
        interpretation.helmAcknowledgment = interpretation.helmAcknowledgment.replace(
          /course (\d{3})/,
          `course ${formatNavalCourse(course)}`
        )
      }

      // Add the original and corrected commands to the response
      return NextResponse.json({
        ...interpretation,
        originalCommand: command,
        correctedCommand: correctedCommand
      })
    } catch (error) {
      console.error('Error processing command:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        { error: `Failed to process command: ${errorMessage}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}