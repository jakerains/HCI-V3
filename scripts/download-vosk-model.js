const https = require('https');
const fs = require('fs');
const path = require('path');
const { mkdirp } = require('mkdirp');

const MODEL_NAME = 'vosk-model-small-en-us-0.15';
const MODEL_URL = `https://alphacephei.com/vosk/models/${MODEL_NAME}.tar.gz`;
const MODELS_DIR = path.join(process.cwd(), 'models');
const MODEL_DIR = path.join(MODELS_DIR, MODEL_NAME);

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log('Downloading Vosk model...');
    const file = fs.createWriteStream(dest);
    
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedSize = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = totalSize ? Math.round((downloadedSize / totalSize) * 100) : 'unknown';
        process.stdout.write(`Download progress: ${progress}%\r`);
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\nDownload complete');
        resolve();
      });
    });

    request.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function setupModel() {
  try {
    // Create directories if they don't exist
    await mkdirp(MODEL_DIR);

    const modelPath = path.join(MODELS_DIR, `${MODEL_NAME}.tar.gz`);
    
    // Download the model if it doesn't exist
    if (!fs.existsSync(modelPath)) {
      await downloadFile(MODEL_URL, modelPath);
      console.log('Model downloaded successfully');
    } else {
      console.log('Model already exists');
    }
  } catch (error) {
    console.error('Error setting up Vosk model:', error);
    throw error;
  }
}

setupModel().catch(console.error); 