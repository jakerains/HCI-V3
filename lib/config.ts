// Default hardwired values
const DEFAULT_ELEVENLABS_VOICE_ID = '9PVP7ENhDskL0KYHAKtD'
const DEFAULT_ELEVENLABS_MODEL_ID = 'eleven_flash_v2'
const DEFAULT_GROQ_MODEL_ID = 'llama-3.3-70b-specdec'

// Configuration with environment variable overrides
export const config = {
  elevenlabs: {
    voiceId: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || DEFAULT_ELEVENLABS_VOICE_ID,
    modelId: process.env.NEXT_PUBLIC_ELEVENLABS_MODEL_ID || DEFAULT_ELEVENLABS_MODEL_ID,
    apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
  },
  groq: {
    modelId: process.env.GROQ_MODEL_ID || DEFAULT_GROQ_MODEL_ID,
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  }
} 