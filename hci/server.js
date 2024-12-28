const vosk = require('vosk')
const WebSocket = require('ws')
const path = require('path')

// Initialize Vosk model
const modelPath = path.join(__dirname, 'models')
const model = new vosk.Model(modelPath)

const wss = new WebSocket.Server({ port: 2700 })

console.log('WebSocket server starting on port 2700...')

wss.on('connection', (ws) => {
  console.log('Client connected')
  
  const recognizer = new vosk.Recognizer({model: model, sampleRate: 16000})
  
  ws.on('message', (data) => {
    try {
      if (recognizer.acceptWaveform(data)) {
        const result = recognizer.result()
        ws.send(JSON.stringify(result))
      } else {
        const partial = recognizer.partialResult()
        ws.send(JSON.stringify(partial))
      }
    } catch (error) {
      console.error('Error processing audio:', error)
    }
  })
  
  ws.on('close', () => {
    console.log('Client disconnected')
    recognizer.free()
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

process.on('SIGINT', () => {
  wss.close(() => {
    console.log('WebSocket server stopped')
    process.exit(0)
  })
}) 