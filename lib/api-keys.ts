export function getGeminiApiKey() {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('geminiApiKey')
    if (localKey) return localKey
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || null
}

export function getElevenLabsApiKey() {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('elevenLabsApiKey')
    if (localKey) return localKey
  }
  return process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null
}

export function checkApiKeys() {
  return {
    gemini: !!getGeminiApiKey(),
    elevenLabs: !!getElevenLabsApiKey()
  }
} 