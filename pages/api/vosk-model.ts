import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { mkdirp } from 'mkdirp'
import { createWriteStream } from 'fs'
import { unzipModel } from '@/utils/unzip'

const MODELS_DIR = path.join(process.cwd(), 'models')

type ModelStatus = {
  id: string
  installed: boolean
  inProgress?: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Get status of all models
    const statuses = await getModelStatuses()
    return res.status(200).json(statuses)
  } 
  else if (req.method === 'POST') {
    const { modelId, url } = req.body

    if (!modelId || !url) {
      return res.status(400).json({ error: 'Model ID and URL are required' })
    }

    try {
      const modelDir = path.join(MODELS_DIR, modelId)
      
      // Create models directory if it doesn't exist
      await mkdirp(MODELS_DIR)
      
      // Start download
      const downloadPromise = downloadModel(url, modelId)
      
      // Return immediately while download continues in background
      res.status(200).json({ message: 'Download started' })
      
      // Wait for download to complete
      await downloadPromise
    } catch (error) {
      console.error('Error downloading model:', error)
      // Since we already sent the response, we can't send an error response
      // The client will need to check the status endpoint for errors
    }
  } 
  else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

function isModelInstalled(modelPath: string): boolean {
  // Check for essential Vosk model directories and files
  const requiredDirs = ['am', 'conf', 'graph', 'ivector']
  const requiredFiles = [
    path.join('am', 'final.mdl'),
    path.join('conf', 'mfcc.conf'),
    path.join('conf', 'model.conf'),
    path.join('graph', 'phones', 'word_boundary.int'),
    path.join('ivector', 'final.dubm')
  ]

  try {
    // Check if all required directories exist
    const hasDirs = requiredDirs.every(dir => 
      fs.existsSync(path.join(modelPath, dir)) && 
      fs.statSync(path.join(modelPath, dir)).isDirectory()
    )

    if (!hasDirs) return false

    // Check if all required files exist
    const hasFiles = requiredFiles.every(file => 
      fs.existsSync(path.join(modelPath, file))
    )

    return hasFiles
  } catch (error) {
    console.error('Error checking model installation:', error)
    return false
  }
}

async function getModelStatuses(): Promise<ModelStatus[]> {
  const statuses: ModelStatus[] = []
  
  // Create models directory if it doesn't exist
  if (!fs.existsSync(MODELS_DIR)) {
    await mkdirp(MODELS_DIR)
  }

  // Define the models we want to check
  const modelIds = ['vosk-model-small-en-us-0.15', 'vosk-model-en-us-0.22']
  
  // Check each model
  for (const modelId of modelIds) {
    const modelPath = path.join(MODELS_DIR, modelId)
    const installed = fs.existsSync(modelPath) && isModelInstalled(modelPath)
    
    statuses.push({
      id: modelId,
      installed
    })
  }

  return statuses
}

async function downloadModel(url: string, modelId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const modelDir = path.join(MODELS_DIR, modelId)
    const zipPath = path.join(MODELS_DIR, `${modelId}.zip`)

    // Create a write stream for the zip file
    const fileStream = createWriteStream(zipPath)

    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        return
      }

      response.pipe(fileStream)

      fileStream.on('finish', async () => {
        fileStream.close()
        
        try {
          // Create model directory
          await mkdirp(modelDir)

          // Unzip the file
          await unzipModel(zipPath, modelDir)

          // Clean up zip file
          fs.unlinkSync(zipPath)
          
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    }).on('error', error => {
      fs.unlink(zipPath, () => {}) // Clean up partial file
      reject(error)
    })
  })
} 