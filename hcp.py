import os
import json
import gradio as gr
from groq import Groq
import tempfile
from dotenv import load_dotenv
import numpy as np
import soundfile as sf
import asyncio
import websockets
import base64

# Load environment variables
load_dotenv()

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# ElevenLabs voice and model configuration
VOICE_ID = "PODaWQBE9fnXYis1ztG8"
MODEL_ID = "eleven_flash_v2"

def process_command_with_llm(transcription):
    """Process the transcribed command with Llama model."""
    if not transcription or not isinstance(transcription, str):
        print(f"Invalid transcription received: {transcription}")
        return {"error": "No valid transcription received"}
        
    system_prompt = """You are a naval ship's helm command processor. Your task is to extract structured information from helm commands following standard naval protocols.

    Commands can include:
    - Speed commands: "all ahead/astern" followed by speed (full, half, two thirds, one third, slow)
    - Rudder commands: direction (left/right) followed by angle (degrees or standard/full)
    - Course commands: "steady course" followed by heading (degrees or cardinal directions)

    For the command: "{transcription}"

    Return ONLY a JSON object with this exact structure (include only fields that are present in the command):
    {{
        "rudder": {{"direction": "left/right", "angle": "number or standard/full"}},
        "course": "number or cardinal direction",
        "speed": {{"direction": "ahead/astern", "value": "full/half/two thirds/one third/slow"}}
    }}

    Example Commands and Outputs:

    1. Speed Command:
    Input: "Helm, all ahead full"
    Output: {{"speed": {{"direction": "ahead", "value": "full"}}}}

    2. Rudder Command:
    Input: "Helm, left standard rudder"
    Output: {{"rudder": {{"direction": "left", "angle": "standard"}}}}

    3. Course Command:
    Input: "Helm, steady course north"
    Output: {{"course": "north"}}

    4. Combined Command:
    Input: "Helm, right 15 degree rudder, steady course 180"
    Output: {{"rudder": {{"direction": "right", "angle": "15"}}, "course": "180"}}

    5. Complex Command:
    Input: "Helm, all ahead two thirds, left 20 degree rudder"
    Output: {{"speed": {{"direction": "ahead", "value": "two thirds"}}, "rudder": {{"direction": "left", "angle": "20"}}}}

    Only include the JSON output, nothing else. Ensure all values are lowercase."""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": transcription}
    ]
    
    try:
        response = client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            temperature=0.1
        )
        
        # Clean and parse the response
        response_text = response.choices[0].message.content.strip()
        # Remove any markdown formatting if present
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        print(f"LLM Response: {response_text}")
        
        return json.loads(response_text)
    except Exception as e:
        print(f"Error processing command with LLM: {e}")
        print(f"Raw LLM response: {response.choices[0].message.content}")
        return {"error": "Failed to process command"}

async def generate_voice_response_stream(text):
    """Generate voice response using ElevenLabs websocket streaming."""
    uri = f"wss://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream-input?model_id={MODEL_ID}&output_format=mp3_44100_128"
    audio_data = bytearray()

    async with websockets.connect(uri) as websocket:
        # Initialize the connection
        bos_message = {
            "text": " ",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            },
            "xi_api_key": os.environ.get("ELEVENLABS_API_KEY"),
        }
        await websocket.send(json.dumps(bos_message))

        # Send text input with flush parameter
        input_message = {
            "text": text,
            "flush": True
        }
        await websocket.send(json.dumps(input_message))

        # Send EOS message
        eos_message = {
            "text": ""
        }
        await websocket.send(json.dumps(eos_message))

        # Handle the response
        while True:
            try:
                response = await websocket.recv()
                data = json.loads(response)
                if data.get("audio"):
                    chunk = base64.b64decode(data["audio"])
                    audio_data.extend(chunk)
                if data.get("isFinal"):
                    break
            except websockets.exceptions.ConnectionClosed:
                break
            except Exception as e:
                print(f"Error in websocket stream: {e}")
                break

    return bytes(audio_data)

def generate_voice_response(command_data):
    """Generate a standardized voice response based on the command."""
    if "error" in command_data:
        response_text = "I'm sorry, I couldn't process that command. Please try again."
    else:
        # Start building the response by repeating the command
        response_parts = []
        
        # Handle speed commands
        if "speed" in command_data:
            speed_info = command_data["speed"]
            direction = speed_info.get("direction", "")
            value = speed_info.get("value", "")
            response_parts.append(f"all {direction} {value}")
        
        # Handle rudder commands
        if "rudder" in command_data:
            direction = command_data["rudder"].get("direction", "")
            angle = command_data["rudder"].get("angle", "")
            response_parts.append(f"{direction} {angle} degree rudder")
        
        # Handle course commands
        if "course" in command_data:
            response_parts.append(f"steady course {command_data['course']}")
        
        # Combine all parts with proper formatting
        response_text = ", ".join(filter(None, response_parts))
        if response_text:
            response_text = f"{response_text}, Helm, Aye!"
        else:
            response_text = "Helm, Aye!"  # Fallback if no specific command parts
    
    try:
        # Generate audio using websocket streaming
        audio = asyncio.run(generate_voice_response_stream(response_text))
        if not audio:
            print("No audio data received")
            return None
            
        # Save audio response to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        temp_file.write(audio)
        temp_file.close()
        print(f"Audio saved to: {temp_file.name}")
        return temp_file.name
        
    except Exception as e:
        print(f"Error generating voice response: {e}")
        return None

def convert_audio_to_wav(audio_path):
    """Convert audio to WAV format with proper parameters."""
    try:
        # Read the audio file
        data, samplerate = sf.read(audio_path)
        
        # Convert to mono if stereo
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)
        
        # Create a temporary WAV file
        temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        sf.write(temp_wav.name, data, samplerate, format='WAV')
        temp_wav.close()
        
        return temp_wav.name
    except Exception as e:
        print(f"Error converting audio: {e}")
        return None

def process_audio(audio_data):
    """Process recorded audio through the entire pipeline."""
    print(f"Received audio data: {type(audio_data)}")
    
    if audio_data is None:
        print("No audio input received")
        return "No audio input received", {"error": "No audio input"}, None
    
    try:
        # Handle tuple input from Gradio (path, sampling_rate)
        if isinstance(audio_data, tuple):
            audio_path, sr = audio_data
        else:
            audio_path = audio_data
            
        print(f"Processing audio from path: {audio_path}")
            
        # Convert audio to proper format
        wav_path = convert_audio_to_wav(audio_path)
        if wav_path is None:
            return "Error converting audio format", {"error": "Audio conversion failed"}, None
        
        # Transcribe with Whisper
        with open(wav_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(wav_path, file.read()),
                model="whisper-large-v3-turbo",
                response_format="text",
                language="en",
                temperature=0.0
            )
            print(f"Transcription result: {transcription}")
            
        # Clean up temporary file
        os.unlink(wav_path)
        
        # Process with LLM
        command_data = process_command_with_llm(transcription)
        print(f"Processed command data: {command_data}")
        
        # Generate voice response
        audio_response_path = generate_voice_response(command_data)
        
        return transcription, command_data, audio_response_path
        
    except Exception as e:
        print(f"Error in process_audio: {e}")
        return str(e), {"error": str(e)}, None

def format_command_display(command_data):
    """Format command data for display."""
    if "error" in command_data:
        return command_data["error"]
        
    display_text = ""
    if "rudder" in command_data:
        display_text += f"Rudder: {command_data['rudder']['direction'].capitalize()}\n\n"
        display_text += f"Angle: {command_data['rudder']['angle']} degrees\n\n"
    if "course" in command_data:
        display_text += f"Course: {command_data['course']}\n\n"
    if "speed" in command_data:
        speed_info = command_data["speed"]
        display_text += f"Direction: {speed_info.get('direction', '').capitalize()}\n\n"
        display_text += f"Speed: {speed_info.get('value', '').capitalize()}"
    
    return display_text.strip()

def create_interface():
    """Create the Gradio interface."""
    with gr.Blocks(theme=gr.themes.Soft()) as interface:
        gr.Markdown("""
        # Ship's Helm Command Interface
        
        ## Instructions:
        1. Click the microphone button and allow microphone access
        2. Speak your command clearly (e.g., "helm, left 10 degree rudder")
        3. Wait for the system to process and respond
        
        ## Example Commands:
        - "Helm, left 10 degree rudder, steady course 130"
        - "Helm, all ahead full"
        - "Helm, left standard rudder, steady course north"
        """)
        
        with gr.Row():
            with gr.Column():
                status_text = gr.Textbox(
                    label="Status",
                    value="Ready to record",
                    interactive=False
                )
                with gr.Row():
                    audio_input = gr.Audio(
                        label="Speak your command",
                        sources=["microphone"],
                        type="filepath",
                        format="wav",
                        streaming=False,
                        show_label=True
                    )
                    new_command_btn = gr.Button("New Command")
        
        with gr.Row():
            with gr.Column():
                transcription_output = gr.Textbox(
                    label="Transcribed Command",
                    interactive=False
                )
                formatted_output = gr.Textbox(
                    label="Processed Command",
                    interactive=False,
                    lines=5
                )
                command_output = gr.JSON(
                    label="Raw Command Data",
                    visible=False
                )
        
        with gr.Row():
            audio_response = gr.Audio(
                label="System Response",
                type="filepath",
                interactive=False,
                autoplay=True,
                format="mp3"
            )
            
        def update_status(audio):
            if audio is None:
                return "Ready to record"
            return "Processing command..."
        
        def process_and_format(audio_data):
            # Process the audio
            transcription, command_data, audio_response = process_audio(audio_data)
            # Format the command data for display
            formatted_text = format_command_display(command_data)
            return transcription, formatted_text, command_data, audio_response
            
        def reset_interface():
            return {
                audio_input: None,
                status_text: "Ready for new command",
                transcription_output: "",
                formatted_output: "",
                command_output: None,
                audio_response: None
            }
        
        # Add status updates
        audio_input.change(
            fn=update_status,
            inputs=[audio_input],
            outputs=[status_text],
            queue=False
        ).then(
            fn=process_and_format,
            inputs=[audio_input],
            outputs=[
                transcription_output,
                formatted_output,
                command_output,
                audio_response
            ]
        )
        
        # Add new command button functionality
        new_command_btn.click(
            fn=reset_interface,
            inputs=[],
            outputs=[
                audio_input,
                status_text,
                transcription_output,
                formatted_output,
                command_output,
                audio_response
            ]
        )
    
    return interface

if __name__ == "__main__":
    interface = create_interface()
    interface.launch(
        debug=True,
        share=False,
        server_name="0.0.0.0",
        server_port=7860,
        show_error=True
    ) 