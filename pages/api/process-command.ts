import type { NextApiRequest, NextApiResponse } from 'next'
import { Groq } from 'groq-sdk'
import { getGroqApiKey } from '@/lib/api-keys'

// Function to convert numbers to naval style pronunciation
function formatNavalNumber(num: number): string {
  return num.toString()
    .split('')
    .map(digit => {
      switch (digit) {
        case '0': return 'zero'
        case '1': return 'one'
        case '2': return 'two'
        case '3': return 'three'
        case '4': return 'four'
        case '5': return 'five'
        case '6': return 'six'
        case '7': return 'seven'
        case '8': return 'eight'
        case '9': return 'niner'
        default: return digit
      }
    })
    .join(' ')
}

// Function to format the command response in naval style
function formatNavalResponse(command: string): string {
  // Format course changes (e.g., "course 180" -> "course one eight zero")
  // Also handle standalone "nine" or "9" -> "niner"
  return command
    .replace(/\b(\d+)\b/g, (match) => {
      const num = parseInt(match)
      return formatNavalNumber(num)
    })
    .replace(/\b(nine|9)\b/g, 'niner')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const groqApiKey = getGroqApiKey()
  if (!groqApiKey) {
    return res.status(401).json({ error: 'Groq API key is required' })
  }

  const { command, currentState } = req.body

  if (!command) {
    return res.status(400).json({ error: 'Command is required' })
  }

  try {
    const groq = new Groq({ apiKey: groqApiKey })

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a naval ship's helm control system. You process verbal commands from the commanding officer and translate them into specific rudder angles, speed settings, and course changes.

Current ship state:
- Rudder angle: ${currentState.rudder}° (positive is starboard, negative is port)
- Speed: ${currentState.speed} (percentage of full power, negative is astern)
- Course: ${currentState.course}° (0-360, where 0/360 is North)

Respond with a JSON object containing:
1. correctedCommand: The formal version of the command (use individual digits for numbers, e.g., "course one eight zero" not "course one eighty")
2. stateUpdates: Changes to make to rudder/speed/course (null for no change)
3. statusReport: A brief status report of what's changing (use individual digits for numbers)

Example responses:
{
  "correctedCommand": "course one eight zero",
  "stateUpdates": {
    "rudder": null,
    "speed": null,
    "course": 180
  },
  "statusReport": "Coming to course one eight zero"
}

{
  "correctedCommand": "rudder right one five degrees",
  "stateUpdates": {
    "rudder": 15,
    "speed": null,
    "course": null
  },
  "statusReport": "Turning rudder one five degrees to starboard"}`
        },
        {
          role: 'user',
          content: command
        }
      ],
      model: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-specdec',
      temperature: 0.1,
      max_tokens: 500,
      top_p: 1,
      stream: false,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from Groq')
    }

    try {
      const parsedResponse = JSON.parse(response)
      
      // Format the response to ensure proper naval number pronunciation
      parsedResponse.correctedCommand = formatNavalResponse(parsedResponse.correctedCommand)
      parsedResponse.statusReport = formatNavalResponse(parsedResponse.statusReport)
      
      return res.status(200).json(parsedResponse)
    } catch (error) {
      console.error('Failed to parse Groq response:', response)
      throw new Error('Invalid response format from Groq')
    }

  } catch (error) {
    console.error('Error processing command:', error)
    return res.status(500).json({ 
      error: 'Failed to process command',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 