# Navy Whisper

A naval helm interface with voice command capabilities and real-time status updates.

## Prerequisites

- Node.js 18+ 
- Vosk speech recognition model
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

3. Download the Vosk model and place it in the `/models` directory

4. Start the development server:
```bash
npm run dev
```

## Features

- Voice command recognition
- Text-to-speech responses
- Real-time compass display
- Engine telegraph status
- Rudder angle visualization
- Command history logging

## License

MIT
