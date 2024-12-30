export function getGroqApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('GROQ_API_KEY')
    if (localKey) return localKey
  }
  return process.env.NEXT_PUBLIC_GROQ_API_KEY || null
}

export function getElevenLabsApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('ELEVENLABS_API_KEY')
    if (localKey) return localKey
  }
  return process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || null
}

export function checkApiKeys(): { groq: boolean, elevenLabs: boolean } {
  return {
    groq: !!getGroqApiKey(),
    elevenLabs: !!getElevenLabsApiKey()
  }
} 