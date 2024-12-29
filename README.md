# Navy Whisper

A naval helm interface with voice command capabilities and real-time status updates.

## Prerequisites

- Node.js 18+ 
- ElevenLabs API key
- GROQ API key

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your API keys:
```
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key_here
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id_here
NEXT_PUBLIC_ELEVENLABS_MODEL_ID=eleven_flash_v2_5
GROQ_API_KEY=your_key_here
GROQ_MODEL_ID=llama-3.3-70b-specdec
```

3. Start the development server:
```bash
npm run dev
```

Note: The Vosk speech recognition model (small English model, ~40MB) will be automatically downloaded and set up on first run if not present.

## Features

- Voice command recognition using Vosk (offline capable)
- Text-to-speech responses via ElevenLabs
- Real-time compass display
- Engine telegraph status
- Rudder angle visualization
- Command history logging

## Development

The project runs two servers concurrently:
- Next.js frontend on default port (3000)
- WebSocket server for voice recognition on port 2700

## License

MIT
