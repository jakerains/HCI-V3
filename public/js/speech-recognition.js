import { createModel } from 'vosk-browser';

class SpeechRecognition {
  constructor() {
    this.model = null;
    this.recognizer = null;
    this.ws = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.processor = null;
  }

  async initialize() {
    try {
      // Initialize WebSocket connection
      this.ws = new WebSocket('ws://localhost:2700');
      
      // Load the model
      console.log('Loading speech recognition model...');
      this.model = await createModel('vosk-model-small-en-us-0.15/model.tar.gz');
      console.log('Model loaded');

      // Create recognizer
      this.recognizer = new this.model.KaldiRecognizer(16000);
      
      // Initialize audio
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000
        }
      });

      // Create audio processing pipeline
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      // Process audio
      this.processor.onaudioprocess = async (e) => {
        const data = e.inputBuffer.getChannelData(0);
        const result = await this.recognizer.acceptWaveform(data);
        
        if (result) {
          const text = this.recognizer.result().text;
          if (text) {
            console.log('Recognized:', text);
            // Send the result to the server if needed
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ text }));
            }
          }
        }
      };

      // Connect the audio nodes
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      console.log('Speech recognition initialized');
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      throw error;
    }
  }

  stop() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.processor) {
      this.processor.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.recognizer) {
      this.recognizer.free();
    }
    if (this.model) {
      this.model.free();
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Export the class
export default SpeechRecognition; 