'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { ArrowLeft, Save, Key, CheckCircle2, Download, Cpu, Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const VOSK_MODELS = {
  small: {
    id: 'vosk-model-small-en-us-0.15',
    name: 'Small US English Model',
    size: '40MB',
    url: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
    description: 'Lightweight wideband model for Android and RPi. WER: 9.85 (librispeech test-clean)',
  },
  large: {
    id: 'vosk-model-en-us-0.22',
    name: 'Large US English Model',
    size: '1.8GB',
    url: 'https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip',
    description: 'Accurate generic US English model. WER: 5.69 (librispeech test-clean)',
  }
}

type ModelStatus = {
  id: string
  installed: boolean
  inProgress?: boolean
  error?: string
}

export default function Settings() {
  const [groqKey, setGroqKey] = useState('')
  const [elevenLabsKey, setElevenLabsKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('small')
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)
  const [envKeys, setEnvKeys] = useState({
    groq: false,
    elevenLabs: false
  })
  const { toast } = useToast()
  const { theme } = useTheme()

  useEffect(() => {
    // Check environment variables
    setEnvKeys({
      groq: !!process.env.NEXT_PUBLIC_GROQ_API_KEY,
      elevenLabs: !!process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    })

    // Load existing keys from localStorage if they exist
    const savedGroqKey = localStorage.getItem('GROQ_API_KEY')
    const savedElevenLabsKey = localStorage.getItem('ELEVENLABS_API_KEY')
    const savedModel = localStorage.getItem('VOSK_MODEL')
    
    if (savedGroqKey) setGroqKey(savedGroqKey)
    if (savedElevenLabsKey) setElevenLabsKey(savedElevenLabsKey)
    if (savedModel) setSelectedModel(savedModel)

    // Load model statuses
    fetchModelStatuses()
  }, [])

  const fetchModelStatuses = async () => {
    try {
      const response = await fetch('/api/vosk-model')
      if (!response.ok) throw new Error('Failed to fetch model statuses')
      const statuses = await response.json()
      setModelStatuses(statuses)
    } catch (error) {
      console.error('Error fetching model statuses:', error)
      toast({
        title: "Error",
        description: "Failed to fetch model statuses",
        className: theme.status.error
      })
    }
  }

  const handleSave = () => {
    // Save keys to localStorage with the correct key names
    if (groqKey) localStorage.setItem('GROQ_API_KEY', groqKey)
    if (elevenLabsKey) localStorage.setItem('ELEVENLABS_API_KEY', elevenLabsKey)
    localStorage.setItem('VOSK_MODEL', selectedModel)

    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully. Please restart the application for changes to take effect.",
      className: theme.status.success
    })
  }

  const handleDownloadModel = async (modelId: string, modelUrl: string) => {
    setDownloading(modelId)
    try {
      const response = await fetch('/api/vosk-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId, url: modelUrl }),
      })

      if (!response.ok) throw new Error('Failed to start download')

      toast({
        title: "Download Started",
        description: "The model download has started. This may take a while.",
        className: theme.status.success
      })

      // Poll for status updates
      const checkStatus = setInterval(async () => {
        const statuses = await fetch('/api/vosk-model').then(res => res.json())
        setModelStatuses(statuses)
        
        const status = statuses.find((s: ModelStatus) => s.id === modelId)
        if (status?.installed) {
          clearInterval(checkStatus)
          setDownloading(null)
          toast({
            title: "Download Complete",
            description: "The model has been downloaded and installed successfully.",
            className: theme.status.success
          })
        } else if (status?.error) {
          clearInterval(checkStatus)
          setDownloading(null)
          toast({
            title: "Download Failed",
            description: status.error,
            className: theme.status.error
          })
        }
      }, 5000) // Check every 5 seconds

    } catch (error) {
      console.error('Error downloading model:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download the model. Please try again.",
        className: theme.status.error
      })
      setDownloading(null)
    }
  }

  const isModelInstalled = (modelId: string) => {
    return modelStatuses.some(status => status.id === modelId && status.installed)
  }

  return (
    <div className={`min-h-screen ${theme.colors.background} ${theme.text.primary}`}>
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <Link 
            href="/" 
            className={`inline-flex items-center text-sm ${theme.text.muted} hover:${theme.text.primary}`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Helm
          </Link>
        </div>

        <div className="space-y-6">
          <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder}`}>
            <CardHeader>
              <CardTitle className={`text-xl font-bold ${theme.text.primary} flex items-center gap-2`}>
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="groq-key" className={theme.text.secondary}>Groq API Key</Label>
                  {envKeys.groq && (
                    <div className="flex items-center text-sm text-green-500 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Available from environment
                    </div>
                  )}
                </div>
                <Input
                  id="groq-key"
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder={envKeys.groq ? "Using environment variable" : "Enter your Groq API key"}
                  className={`${theme.colors.cardBackground} ${theme.colors.cardBorder} ${theme.text.primary}`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="elevenlabs-key" className={theme.text.secondary}>ElevenLabs API Key</Label>
                  {envKeys.elevenLabs && (
                    <div className="flex items-center text-sm text-green-500 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Available from environment
                    </div>
                  )}
                </div>
                <Input
                  id="elevenlabs-key"
                  type="password"
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value)}
                  placeholder={envKeys.elevenLabs ? "Using environment variable" : "Enter your ElevenLabs API key"}
                  className={`${theme.colors.cardBackground} ${theme.colors.cardBorder} ${theme.text.primary}`}
                />
              </div>

              <div className={`text-sm ${theme.text.muted}`}>
                Note: Keys saved here will override environment variables.
              </div>
            </CardContent>
          </Card>

          <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder}`}>
            <CardHeader>
              <CardTitle className={`text-xl font-bold ${theme.text.primary} flex items-center gap-2`}>
                <Cpu className="h-5 w-5" />
                Speech Recognition Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup 
                value={selectedModel} 
                onValueChange={setSelectedModel}
                className="space-y-4"
              >
                {Object.entries(VOSK_MODELS).map(([key, model]) => {
                  const installed = isModelInstalled(model.id)
                  const isDownloading = downloading === model.id

                  return (
                    <div key={key} className={`flex items-start space-x-3 p-4 rounded-lg border ${theme.colors.cardBorder}`}>
                      <RadioGroupItem value={key} id={key} disabled={!installed && !isDownloading} />
                      <div className="flex-1 space-y-1">
                        <Label 
                          htmlFor={key} 
                          className={`text-base font-medium ${theme.text.primary} flex items-center justify-between`}
                        >
                          {model.name}
                          <span className={`text-sm ${theme.text.muted}`}>{model.size}</span>
                        </Label>
                        <p className={`text-sm ${theme.text.muted}`}>{model.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {installed ? (
                            <div className="flex items-center text-sm text-green-500 dark:text-green-400">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Installed
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadModel(model.id, model.url)}
                              disabled={isDownloading}
                              className={theme.colors.cardBorder}
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-1" />
                                  Download Model
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>

              <div className={`text-sm ${theme.text.muted}`}>
                Note: Changing the model requires restarting the application.
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave} 
            className={`w-full ${theme.status.success}`}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>

        <div className={`text-[10px] ${theme.text.muted} text-center mt-4`}>
          v0.3.0
        </div>
      </div>
    </div>
  )
} 