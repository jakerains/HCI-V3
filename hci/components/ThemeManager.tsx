'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useToast } from './ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function ThemeManager() {
  const [name, setName] = useState('')
  const [themeCode, setThemeCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Auto-detect theme name from pasted code
  useEffect(() => {
    if (!themeCode) return

    try {
      // Try to find theme name in comments
      const commentMatch = themeCode.match(/\/\/\s*Theme Name:\s*\[?([^\]\n]+)\]?/)
      if (commentMatch) {
        setName(commentMatch[1].trim())
        return
      }

      // Try to find theme name in the object itself
      const nameMatch = themeCode.match(/name:\s*["']([^"']+)["']/)
      if (nameMatch) {
        // Convert to camelCase for the key
        const themeName = nameMatch[1]
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        setName(themeName)
        return
      }
    } catch (error) {
      console.error('Error parsing theme name:', error)
    }
  }, [themeCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/add-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          theme: themeCode,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Theme added successfully. Please restart the app to see changes.',
        })
        setName('')
        setThemeCode('')
      } else {
        throw new Error(data.error || 'Failed to add theme')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add theme',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Theme</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="theme" className="block text-sm font-medium mb-1">
              Theme Code
            </label>
            <Textarea
              id="theme"
              value={themeCode}
              onChange={(e) => setThemeCode(e.target.value)}
              placeholder="Paste your theme object here..."
              className="font-mono h-[300px]"
              required
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Theme Name {name && <span className="text-xs text-muted-foreground">(auto-detected)</span>}
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., modernNavy"
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Theme...' : 'Add Theme'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 