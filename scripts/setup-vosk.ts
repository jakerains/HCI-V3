import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as unzipper from 'unzipper'
import { mkdirp } from 'mkdirp'

const MODEL_NAME = 'vosk-model-small-en-us-0.15'
const VOSK_MODEL_URL = `https://alphacephei.com/vosk/models/${MODEL_NAME}.zip`
const MODEL_DIR = path.join(process.cwd(), 'models')
const MODEL_PATH = path.join(MODEL_DIR, MODEL_NAME)
const MODEL_ZIP = path.join(MODEL_DIR, 'model.zip')

function listDirectoryContents(dir: string, indent: string = ''): void {
  console.log(`${indent}Directory contents of ${dir}:`)
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stats = fs.statSync(fullPath)
    if (stats.isDirectory()) {
      console.log(`${indent}- [DIR] ${item}`)
      listDirectoryContents(fullPath, indent + '  ')
    } else {
      console.log(`${indent}- [FILE] ${item} (${stats.size} bytes)`)
    }
  }
}

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Downloading Vosk model...')
    const file = fs.createWriteStream(dest)
    
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`))
        return
      }

      const totalSize = parseInt(response.headers['content-length'] || '0', 10)
      let downloadedSize = 0

      response.on('data', (chunk) => {
        downloadedSize += chunk.length
        const progress = totalSize ? Math.round((downloadedSize / totalSize) * 100) : 'unknown'
        process.stdout.write(`Download progress: ${progress}%\r`)
      })

      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        console.log('\nDownload complete')
        resolve()
      })
    })

    request.on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })

    file.on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
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

    extract.on('entry', (entry) => {
      console.log(`Extracting: ${entry.path}`)
    })

    extract.on('close', () => {
      console.log('Extraction complete')
      listDirectoryContents(dest)
      resolve()
    })

    fs.createReadStream(source).pipe(extract)
  })
}

async function verifyModelFiles(): Promise<boolean> {
  const requiredFiles = [
    'am/final.mdl',
    'conf/mfcc.conf',
    'conf/model.conf',
    'graph/phones/word_boundary.int',
    'ivector/final.dubm',
  ]

  return requiredFiles.every(file => {
    const exists = fs.existsSync(path.join(MODEL_PATH, file))
    if (!exists) {
      console.log(`Missing required file: ${file}`)
    }
    return exists
  })
}

export async function setupVoskModel(): Promise<void> {
  try {
    // Check if model already exists and is valid
    if (await verifyModelFiles()) {
      console.log('Vosk model already installed')
      return
    }

    console.log('Setting up Vosk model in:', MODEL_DIR)

    // Create models directory if it doesn't exist
    await mkdirp(MODEL_DIR)

    // Download the model
    await downloadFile(VOSK_MODEL_URL, MODEL_ZIP)

    // Verify the downloaded file
    const zipStats = fs.statSync(MODEL_ZIP)
    console.log(`Downloaded file size: ${zipStats.size} bytes`)
    if (zipStats.size === 0) {
      throw new Error('Downloaded file is empty')
    }

    // Extract the model
    await extractZip(MODEL_ZIP, MODEL_DIR)

    // Clean up zip file
    fs.unlinkSync(MODEL_ZIP)

    // Final verification
    console.log('Vosk model setup complete. Verifying model files:')
    if (!await verifyModelFiles()) {
      throw new Error('Model files verification failed after setup')
    }
    
    listDirectoryContents(MODEL_DIR)
  } catch (error) {
    console.error('Error setting up Vosk model:', error)
    throw error
  }
} 