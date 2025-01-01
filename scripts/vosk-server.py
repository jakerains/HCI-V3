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

# Models directory
MODELS_DIR = "models"

# Dictionary to store model instances
models = {}

def get_model(model_name):
    """Get or create a model instance."""
    if model_name not in models:
        model_path = os.path.join(MODELS_DIR, model_name)
        if not os.path.exists(model_path):
            raise ValueError(f"Model {model_name} not found in {MODELS_DIR}")
        models[model_name] = Model(model_path)
    return models[model_name]

async def process_audio(websocket, model_name):
    global p
    
    try:
        # Get the appropriate model
        model = get_model(model_name)
        rec = KaldiRecognizer(model, FRAME_RATE)
        
        # Open audio stream
        stream = p.open(
            format=pyaudio.paFloat32,
            channels=CHANNELS,
            rate=FRAME_RATE,
            input=True,
            frames_per_buffer=CHUNK_SIZE
        )
        
        logging.info(f"Started listening with model: {model_name}")
        
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
        
        # Wait for the initial message with model selection
        message = await websocket.recv()
        try:
            data = json.loads(message)
            model_name = data.get('model')
            if not model_name:
                raise ValueError("No model specified")
        except (json.JSONDecodeError, ValueError) as e:
            logging.error(f"Invalid initial message: {str(e)}")
            await websocket.close()
            return
            
        await process_audio(websocket, model_name)
    except Exception as e:
        logging.error(f"Error in websocket_server: {str(e)}")

async def main():
    # Initialize PyAudio
    global p
    p = pyaudio.PyAudio()
    
    try:
        async with websockets.serve(websocket_server, "localhost", 2700):
            await asyncio.Future()  # run forever
    finally:
        p.terminate()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Server stopped by user") 