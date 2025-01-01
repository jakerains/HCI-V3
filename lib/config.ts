// Constants
const DEFAULT_ELEVENLABS_MODEL_ID = 'eleven_flash_v2'
const DEFAULT_GEMINI_MODEL_ID = 'gemini-1.5-flash'

// Configuration with environment variable overrides
export const config = {
  elevenlabs: {
    voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '',
    modelId: process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID || DEFAULT_ELEVENLABS_MODEL_ID,
    apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
  },
  gemini: {
    modelId: DEFAULT_GEMINI_MODEL_ID,
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  }
} 