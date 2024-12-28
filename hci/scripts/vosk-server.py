#!/usr/bin/env python3

import json
import os
import sys
import asyncio
import websockets
import logging
from vosk import Model, KaldiRecognizer
import pyaudio

# Setup logging
logging.basicConfig(level=logging.INFO)

# Audio stream parameters
FRAME_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 8000

if not os.path.exists("model"):
    print("Please download the model from https://alphacephei.com/vosk/models and unpack as 'model' in the current folder.")
    sys.exit(1)

# Initialize Vosk model
model = Model("model")
rec = KaldiRecognizer(model, FRAME_RATE)

# Initialize PyAudio
p = pyaudio.PyAudio()
stream = None

async def process_audio(websocket):
    global stream
    
    try:
        # Open audio stream
        stream = p.open(
            format=pyaudio.paFloat32,
            channels=CHANNELS,
            rate=FRAME_RATE,
            input=True,
            frames_per_buffer=CHUNK_SIZE
        )
        
        logging.info("Started listening")
        
        while True:
            data = stream.read(CHUNK_SIZE, exception_on_overflow=False)
            if len(data) == 0:
                break
                
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                await websocket.send(json.dumps(result))
            else:
                partial = json.loads(rec.PartialResult())
                await websocket.send(json.dumps(partial))
                
    except websockets.exceptions.ConnectionClosed:
        logging.info("Client disconnected")
    except Exception as e:
        logging.error(f"Error in process_audio: {str(e)}")
    finally:
        if stream:
            stream.stop_stream()
            stream.close()
        logging.info("Stopped listening")

async def websocket_server(websocket, path):
    try:
        logging.info("Client connected")
        await process_audio(websocket)
    except Exception as e:
        logging.error(f"Error in websocket_server: {str(e)}")

async def main():
    async with websockets.serve(websocket_server, "localhost", 2700):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Server stopped by user")
    finally:
        p.terminate() 