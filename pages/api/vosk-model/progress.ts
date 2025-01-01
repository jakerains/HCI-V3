import type { NextApiRequest, NextApiResponse } from 'next'

// Store active downloads and their progress
const activeDownloads = new Map<string, number>()

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { modelId } = req.query

  if (!modelId || typeof modelId !== 'string') {
    return res.status(400).json({ error: 'Invalid model ID' })
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  // Send initial progress
  const progress = activeDownloads.get(modelId) || 0
  res.write(`data: ${JSON.stringify({ status: 'downloading', progress })}\n\n`)

  // Set up interval to send progress updates
  const interval = setInterval(() => {
    const progress = activeDownloads.get(modelId)
    if (progress !== undefined) {
      res.write(`data: ${JSON.stringify({ status: 'downloading', progress })}\n\n`)
    }
  }, 1000)

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval)
  })
}

// Export functions to update progress
export function updateProgress(modelId: string, progress: number) {
  activeDownloads.set(modelId, progress)
}

export function completeDownload(modelId: string) {
  activeDownloads.delete(modelId)
} 