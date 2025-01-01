import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { mkdirp } from 'mkdirp'
import * as unzipper from 'unzipper'
import { updateProgress, completeDownload } from './progress'

const MODELS_DIR = path.join(process.cwd(), 'models')

// URLs from https://alphacephei.com/vosk/models
const MODEL_URLS = {
  'vosk-model-small-en-us-0.15': 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
  'vosk-model-en-us-0.22': 'https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip',
  'vosk-model-en-us-0.42-gigaspeech': 'https://alphacephei.com/vosk/models/vosk-model-en-us-0.42-gigaspeech.zip'
}

export const config = {
  api: {
    responseLimit: false,
  },
}

async function extractZip(source: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Extracting model...')
    
    // Verify the zip file exists and has content
    const stats = fs.statSync(source)
    console.log(`Zip file size: ${stats.size} bytes`)
    if (stats.size === 0) {
      reject(new Error('Downloaded zip file is empty'))
      return
    }

    const extract = unzipper.Extract({ path: dest })
    
    extract.on('error', (err) => {
      console.error('Extraction error:', err)
      reject(err)
    })

    extract.on('close', () => {
      console.log('Extraction complete')
      resolve()
    })

    fs.createReadStream(source).pipe(extract)
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET request for listing models
  if (req.method === 'GET') {
    try {
      // Create models directory if it doesn't exist
      if (!fs.existsSync(MODELS_DIR)) {
        await mkdirp(MODELS_DIR)
      }

      // Get list of downloaded models
      const downloadedModels = fs.readdirSync(MODELS_DIR)
        .filter(item => {
          const fullPath = path.join(MODELS_DIR, item)
          return fs.statSync(fullPath).isDirectory() && 
                 item.startsWith('vosk-model-') &&
                 isModelValid(fullPath)
        })

      console.log('Found downloaded models:', downloadedModels)
      return res.status(200).json({ downloadedModels })
    } catch (error) {
      console.error('Error checking models:', error)
      return res.status(500).json({ error: 'Failed to check models' })
    }
  }
  // Handle POST request to download model
  else if (req.method === 'POST') {
    const { modelId } = req.body

    if (!modelId || !MODEL_URLS[modelId]) {
      return res.status(400).json({ error: 'Invalid model ID' })
    }

    try {
      const modelDir = path.join(MODELS_DIR, modelId)
      const modelFile = path.join(MODELS_DIR, `${modelId}.zip`)
      
      // Create models directory if it doesn't exist
      await mkdirp(MODELS_DIR)
      
      console.log('Downloading model from:', MODEL_URLS[modelId])
      
      // Download and extract the model
      await downloadModel(modelId, MODEL_URLS[modelId], modelFile)
      
      console.log('Model downloaded, extracting...')
      updateProgress(modelId, 100)
      
      // Extract the zip file using unzipper
      try {
        await extractZip(modelFile, MODELS_DIR)
      } catch (error) {
        console.error('Error extracting model:', error)
        // Clean up the corrupted file
        if (fs.existsSync(modelFile)) {
          fs.unlinkSync(modelFile)
        }
        throw new Error('Failed to extract model')
      }
      
      console.log('Model extracted, cleaning up...')
      
      // Clean up the zip file
      if (fs.existsSync(modelFile)) {
        fs.unlinkSync(modelFile)
      }
      
      console.log('Download complete')
      completeDownload(modelId)
      
      return res.status(200).json({ message: 'Model downloaded successfully' })
    } catch (error) {
      console.error('Error downloading model:', error)
      completeDownload(modelId)
      return res.status(500).json({ error: 'Failed to download model' })
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

async function downloadModel(modelId: string, url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    let downloadedSize = 0
    let totalSize = 0
    
    const request = https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`))
        return
      }

      totalSize = parseInt(response.headers['content-length'] || '0', 10)

      response.on('data', (chunk) => {
        downloadedSize += chunk.length
        const progress = totalSize ? Math.round((downloadedSize / totalSize) * 100) : 0
        updateProgress(modelId, progress)
      })

      response.pipe(file)

      file.on('finish', () => {
        file.close()
        // Verify file size matches content-length
        const stats = fs.statSync(dest)
        if (stats.size !== totalSize) {
          fs.unlinkSync(dest)
          reject(new Error('Download incomplete or corrupted'))
          return
        }
        resolve()
      })
    })

    request.on('error', error => {
      fs.unlink(dest, () => {}) // Clean up partial file
      reject(error)
    })

    file.on('error', error => {
      fs.unlink(dest, () => {}) // Clean up partial file
      reject(error)
    })

    // Set a timeout of 5 minutes
    request.setTimeout(5 * 60 * 1000, () => {
      request.destroy()
      fs.unlink(dest, () => {})
      reject(new Error('Download timeout'))
    })
  })
}

function isModelValid(modelPath: string): boolean {
  const requiredFiles = [
    'am/final.mdl',
    'conf/mfcc.conf',
    'conf/model.conf',
    'graph/phones/word_boundary.int',
    'ivector/final.dubm',
  ]

  return requiredFiles.every(file => {
    const exists = fs.existsSync(path.join(modelPath, file))
    if (!exists) {
      console.log(`Missing required file: ${file}`)
    }
    return exists
  })
} 