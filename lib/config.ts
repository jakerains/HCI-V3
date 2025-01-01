import { getGeminiApiKey, getElevenLabsApiKey } from './api-keys'

// Constants
const DEFAULT_ELEVENLABS_VOICE_ID = '9PVP7ENhDskL0KYHAKtD'
const DEFAULT_ELEVENLABS_MODEL_ID = 'eleven_flash_v2'
const DEFAULT_GEMINI_MODEL_ID = 'gemini-1.5-flash'

// Configuration with hardcoded values
export const config = {
  elevenlabs: {
    voiceId: DEFAULT_ELEVENLABS_VOICE_ID,
    modelId: DEFAULT_ELEVENLABS_MODEL_ID,
    get apiKey() {
      return getElevenLabsApiKey()
    }
  },
  gemini: {
    modelId: DEFAULT_GEMINI_MODEL_ID,
    get apiKey() {
      return getGeminiApiKey()
    }
  }
} 