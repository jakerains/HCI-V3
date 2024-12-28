# Ship's Helm Command Interface

This application provides a voice interface for ship helm commands, using:
- Groq's Whisper for speech-to-text
- Llama for command processing
- ElevenLabs for text-to-speech responses

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual API keys:
   - Get a Groq API key from [Groq's website](https://console.groq.com)
   - Get an ElevenLabs API key from [ElevenLabs](https://elevenlabs.io)

## Usage

1. Run the application:
   ```bash
   python helm_command_processor.py
   ```
2. The Gradio interface will open in your default web browser
3. Click the microphone button and speak your helm command
4. The system will:
   - Transcribe your speech
   - Process the command
   - Display the structured command data
   - Respond with a voice confirmation

## Example Commands

- "Helm, left 10 degree rudder, steady course 130"
- "Helm, all ahead full"
- "Helm, left standard rudder, steady course north"
- "Helm, left 20 degree rudder, all ahead two thirds"

## Response Format

The system will:
1. Show the transcribed command
2. Display structured command data (rudder, course, speed)
3. Respond verbally with a confirmation in the format: "[Command details], helm aye" 