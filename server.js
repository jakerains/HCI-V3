const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 2700 });

console.log('WebSocket server starting on port 2700...');

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (data) => {
    try {
      // Here you can handle any messages from the client
      // The speech recognition now happens in the browser
      console.log('Received message from client');
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

process.on('SIGINT', () => {
  wss.close(() => {
    console.log('WebSocket server stopped');
    process.exit(0);
  });
}); 