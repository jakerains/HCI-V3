import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from "@google/generative-ai"

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
  return course.toString().padStart(3, '0').split('')
    .map(digit => {
      const num = parseInt(digit) as keyof typeof NAVAL_NUMBERS
      return NAVAL_NUMBERS[num]
    })
    .join(' ')
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
const GEMINI_MODEL = "gemini-1.5-flash"

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      console.error('Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable')
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable. Please set this in your .env.local file.' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

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
      const correctionResult = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `You are a naval command correction system. Return ONLY the corrected command with no explanations.

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

Command to correct: ${command}`
          }]
        }]
      })

      const correctedCommand = correctionResult.response.text().trim()
      console.log('Corrected command:', correctedCommand)

      // Now interpret the command and generate state updates
      console.log('Sending corrected command for interpretation:', correctedCommand)
      const interpretationResult = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{
            text: `You are a naval command interpreter. Parse the command and return a JSON object.

Current ship state: ${JSON.stringify(currentState)}

Rules:
1. Rudder: -35 to +35 (negative=left)
2. Speed: -100 to +110 (negative=astern)
3. Course: 0-359

Return ONLY a JSON object in this exact format:
{
  "stateUpdates": {
    "rudder": number,    // Required: -35 to +35 (negative=left)
    "course": number,    // Required: 0-359
    "speed": null       // Optional: -100 to +110 (negative=astern)
  },
  "helmAcknowledgment": string,  // Required: Just the command acknowledgment
  "statusReport": string         // Required: Brief status only
}

Command to interpret: ${correctedCommand}`
          }]
        }]
      })

      const interpretationText = interpretationResult.response.text().trim()
      console.log('Raw interpretation:', interpretationText)
      
      // Remove markdown code block if present
      const jsonText = interpretationText.replace(/^```json\n|\n```$/g, '').trim()
      console.log('Cleaned JSON:', jsonText)
      const interpretation = JSON.parse(jsonText)

      // Validate the interpretation structure
      if (!interpretation.stateUpdates || !interpretation.helmAcknowledgment || !interpretation.statusReport) {
        throw new Error('Invalid response structure')
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