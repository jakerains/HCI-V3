export default {
  routes: [
    {
      pattern: '/api/process-command',
      methods: ['POST'],
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, x-gemini-key',
      },
    },
    {
      pattern: '/api/text-to-speech',
      methods: ['POST'],
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    },
  ],
  build: {
    command: 'npm run pages:build',
    output: '.vercel/output/static',
  },
  compatibility_flags: ['nodejs_compat'],
  compatibility_date: '2024-02-15',
} 