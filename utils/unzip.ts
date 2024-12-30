import * as unzipper from 'unzipper'
import { createReadStream } from 'fs'
import path from 'path'

export async function unzipModel(zipPath: string, targetDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(zipPath)
    const extract = unzipper.Extract({ path: targetDir })
    
    extract.on('error', reject)
    extract.on('close', resolve)
    
    stream.pipe(extract)
  })
} 