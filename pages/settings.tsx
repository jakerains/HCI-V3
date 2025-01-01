'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { ArrowLeft, Check, Download } from 'lucide-react'

interface VoskModel {
  name: string
  size: string
  description: string
}

const VOSK_MODELS: Record<string, VoskModel> = {
  'vosk-model-small-en-us-0.15': {
    name: 'Small (English)',
    size: '~40MB',
    description: 'Basic accuracy, fastest performance'
  },
  'vosk-model-en-us-0.22': {
    name: 'Medium (English)',
    size: '~1.8GB',
    description: 'Good accuracy, balanced performance'
  },
  'vosk-model-en-us-0.42-gigaspeech': {
    name: 'Large (English)',
    size: '~2.3GB',
    description: 'Best accuracy for podcasts and clear speech'
  }
}

export default function Settings() {
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [downloadedModels, setDownloadedModels] = useState<string[]>([])
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})
  const [geminiKey, setGeminiKey] = useState<string>('')
  const [elevenLabsKey, setElevenLabsKey] = useState<string>('')
  const [apiKeysPresent, setApiKeysPresent] = useState({
    gemini: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    elevenLabs: !!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
  })
  const { toast } = useToast()

  useEffect(() => {
    // Load existing keys from localStorage if they exist
    const savedGeminiKey = localStorage.getItem('GEMINI_API_KEY')
    const savedElevenLabsKey = localStorage.getItem('ELEVENLABS_API_KEY')
    const savedModel = localStorage.getItem('VOSK_MODEL')

    if (savedGeminiKey) setGeminiKey(savedGeminiKey)
    if (savedElevenLabsKey) setElevenLabsKey(savedElevenLabsKey)
    if (savedModel) setSelectedModel(savedModel)

    // Check which models are downloaded
    checkDownloadedModels()
  }, [])

  const checkDownloadedModels = async () => {
    try {
      const response = await fetch('/api/vosk-model')
      const data = await response.json()
      console.log('Downloaded models:', data.downloadedModels) // Debug log
      if (data.downloadedModels) {
        setDownloadedModels(data.downloadedModels)
        // If no model is selected but we have one downloaded, select it
        if (!selectedModel && data.downloadedModels.length > 0) {
          const modelToSelect = data.downloadedModels[0]
          setSelectedModel(modelToSelect)
          localStorage.setItem('VOSK_MODEL', modelToSelect)
        }
      }
    } catch (error) {
      console.error('Error checking downloaded models:', error)
    }
  }

  const handleModelDownload = async (modelId: string) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [modelId]: 0 }))
      
      toast({
        title: 'Downloading model...',
        description: `Downloading ${VOSK_MODELS[modelId].name}. This may take a while.`,
      })

      // First initiate the download
      const response = await fetch('/api/vosk-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId }),
      })

      if (!response.ok) {
        throw new Error('Failed to download model')
      }

      // Set up event source to receive progress updates
      const eventSource = new EventSource(`/api/vosk-model/progress?modelId=${modelId}`)

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.status === 'downloading' || data.status === 'extracting') {
          setDownloadProgress(prev => ({ ...prev, [modelId]: data.progress }))
        }
        else if (data.status === 'complete') {
          eventSource.close()
          setDownloadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[modelId]
            return newProgress
          })
          checkDownloadedModels()
          toast({
            title: 'Model downloaded',
            description: `${VOSK_MODELS[modelId].name} has been downloaded successfully.`,
          })
        }
        else if (data.status === 'error') {
          eventSource.close()
          setDownloadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[modelId]
            return newProgress
          })
          toast({
            title: 'Download failed',
            description: data.error || 'Failed to download the model. Please try again.',
            variant: 'destructive',
          })
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        setDownloadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[modelId]
          return newProgress
        })
        toast({
          title: 'Download failed',
          description: 'Failed to download the model. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error downloading model:', error)
      setDownloadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[modelId]
        return newProgress
      })
      toast({
        title: 'Download failed',
        description: 'Failed to download the model. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Save API keys to localStorage
    if (geminiKey) localStorage.setItem('GEMINI_API_KEY', geminiKey)
    if (elevenLabsKey) localStorage.setItem('ELEVENLABS_API_KEY', elevenLabsKey)
    localStorage.setItem('VOSK_MODEL', selectedModel)

    toast({
      title: 'Settings saved',
      description: 'Your settings have been saved successfully.',
    })
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Helm
        </Link>
      </div>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure your API keys and model settings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="geminiKey">Google Gemini API Key</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="password"
                  id="geminiKey"
                  placeholder={apiKeysPresent.gemini ? '••••••••' : 'Enter your Gemini API key'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                {apiKeysPresent.gemini && (
                  <span className="text-sm text-green-500">Present in .env</span>
                )}
              </div>
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-600 mt-1 inline-block"
              >
                Get Gemini API Key →
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="elevenLabsKey">ElevenLabs API Key</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="password"
                  id="elevenLabsKey"
                  placeholder={apiKeysPresent.elevenLabs ? '••••••••' : 'Enter your ElevenLabs API key'}
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value)}
                />
                {apiKeysPresent.elevenLabs && (
                  <span className="text-sm text-green-500">Present in .env</span>
                )}
              </div>
              <a 
                href="https://elevenlabs.io/subscription" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-600 mt-1 inline-block"
              >
                Get ElevenLabs API Key →
              </a>
            </div>

            <div className="space-y-4">
              <Label>Vosk Model</Label>
              <div className="space-y-3">
                {Object.entries(VOSK_MODELS).map(([modelId, model]) => {
                  const isDownloaded = downloadedModels.includes(modelId)
                  const isSelected = selectedModel === modelId
                  const progress = downloadProgress[modelId]
                  
                  return (
                    <div 
                      key={modelId} 
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        isDownloaded ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {model.name}
                          {isDownloaded && <Check className="h-4 w-4 text-green-500" />}
                        </div>
                        <div className="text-sm text-muted-foreground">{model.description}</div>
                        <div className="text-xs text-muted-foreground">Size: {model.size}</div>
                        {progress !== undefined && (
                          <div className="mt-2">
                            <Progress value={progress} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                              Downloading: {progress}%
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isDownloaded ? (
                          <Button
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => {
                              setSelectedModel(modelId)
                              localStorage.setItem('VOSK_MODEL', modelId)
                            }}
                            className="min-w-[100px]"
                          >
                            {isSelected ? "Selected" : "Select"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleModelDownload(modelId)}
                            className="min-w-[100px]"
                            disabled={progress !== undefined}
                          >
                            {progress !== undefined ? (
                              "Downloading..."
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Button type="submit" className="w-full">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 