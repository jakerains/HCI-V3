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

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState('')
  const [elevenLabsKey, setElevenLabsKey] = useState('')
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({})
  const [downloadedModels, setDownloadedModels] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Load saved API keys
    const savedGeminiKey = localStorage.getItem('geminiApiKey') || ''
    const savedElevenLabsKey = localStorage.getItem('elevenLabsApiKey') || ''
    setGeminiKey(savedGeminiKey)
    setElevenLabsKey(savedElevenLabsKey)

    // Check downloaded models
    fetchDownloadedModels()
  }, [])

  const fetchDownloadedModels = async () => {
    try {
      const response = await fetch('/api/vosk-model')
      const data = await response.json()
      if (data.downloadedModels) {
        setDownloadedModels(data.downloadedModels)
      }
    } catch (error) {
      console.error('Error fetching downloaded models:', error)
    }
  }

  const handleSaveKeys = () => {
    localStorage.setItem('geminiApiKey', geminiKey)
    localStorage.setItem('elevenLabsApiKey', elevenLabsKey)
    toast({
      title: "Settings Saved",
      description: "Your API keys have been saved successfully.",
    })
  }

  const handleModelDownload = async (modelId: string) => {
    try {
      // Start progress monitoring
      const eventSource = new EventSource(`/api/vosk-model/progress?modelId=${modelId}`)
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setDownloadProgress(prev => ({
          ...prev,
          [modelId]: data.progress
        }))
      }

      // Start the download
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

      // Close the event source
      eventSource.close()

      // Clear progress and refresh downloaded models list
      setDownloadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[modelId]
        return newProgress
      })

      await fetchDownloadedModels()

      toast({
        title: "Download Complete",
        description: "Vosk model has been downloaded and installed successfully.",
      })
    } catch (error) {
      console.error('Error downloading model:', error)
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download model",
        variant: "destructive",
      })

      // Clean up on error
      setDownloadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[modelId]
        return newProgress
      })
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Configure your API keys for voice and AI services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Google Gemini API Key</Label>
            <div className="flex gap-2">
              <Input
                id="gemini-key"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
              />
              <Link href="https://makersuite.google.com/app/apikey" target="_blank">
                <Button variant="outline">Get Key</Button>
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
            <div className="flex gap-2">
              <Input
                id="elevenlabs-key"
                type="password"
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                placeholder="Enter your ElevenLabs API key"
              />
              <Link href="https://elevenlabs.io/subscription" target="_blank">
                <Button variant="outline">Get Key</Button>
              </Link>
            </div>
          </div>

          <Button onClick={handleSaveKeys} className="w-full">Save Keys</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vosk Models</CardTitle>
          <CardDescription>Download and manage offline voice recognition models.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(VOSK_MODELS).map(([modelId, model]) => {
            const isDownloaded = downloadedModels.includes(modelId)
            const progress = downloadProgress[modelId]
            const isDownloading = typeof progress === 'number'

            return (
              <div key={modelId} className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{model.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{model.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Size: {model.size}</p>
                  </div>
                  {!isDownloaded && !isDownloading && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleModelDownload(modelId)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  )}
                  {isDownloaded && (
                    <div className="flex items-center text-green-500">
                      <Check className="mr-2 h-4 w-4" />
                      <span className="text-sm">Installed</span>
                    </div>
                  )}
                </div>
                
                {isDownloading && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-center">{progress}% - Downloading...</p>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
} 