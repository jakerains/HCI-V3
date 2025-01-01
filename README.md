# Navy Whisper

A naval helm interface with voice command capabilities and real-time status updates. This application simulates a naval helm control system with voice commands, providing real-time visual feedback through a compass display, engine telegraph, and rudder angle indicator.

## Features

- Voice command recognition using Vosk (offline capable)
- Natural language processing with Google Gemini AI
- Text-to-speech responses via ElevenLabs
- Real-time compass display with course tracking
- Engine telegraph status with speed control
- Rudder angle visualization
- Command history logging
- Dark/Light theme support
- Offline-capable voice recognition

## Prerequisites

- Node.js 18+ 
- Google Gemini API key (for command processing)
- ElevenLabs API key (for voice responses)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd hci-v2
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your API keys:
```
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key_here
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id_here
NEXT_PUBLIC_ELEVENLABS_MODEL_ID=eleven_flash_v2
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
```

4. Start the development server:
```bash
npm run dev
```

The application will start on http://localhost:3000. The Vosk speech recognition model (small English model, ~40MB) will be automatically downloaded and set up on first run if not present.

## Voice Commands

The system responds to naval helm commands in natural language. Example commands:
- "Helm, right 15 degrees rudder, steady on course zero niner zero"
- "Helm, all ahead two-thirds, come left to heading one eight zero"
- "Helm, rudder amidships, all ahead full, steady as she goes"
- "Helm, left standard rudder, reduce speed to one-third"

## Development

The project runs two servers concurrently:
- Next.js frontend on default port (3000)
- WebSocket server for voice recognition on port 2700

### Project Structure
- `/components` - React components including the main helm interface
- `/pages` - Next.js pages and API routes
- `/lib` - Utility functions and configuration
- `/hooks` - Custom React hooks for voice recognition and audio
- `/public` - Static assets and Vosk model files

## Getting API Keys

1. Google Gemini API Key:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key

2. ElevenLabs API Key:
   - Visit [ElevenLabs](https://elevenlabs.io/subscription)
   - Sign up for an account and get your API key

## License

MIT
