'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CommandEntry {
  timestamp: string
  command: string
  helmResponse: string
  statusReport: string
}

export default function CommandHistory() {
  const [history, setHistory] = useState<CommandEntry[]>([])

  useEffect(() => {
    const savedHistory = localStorage.getItem('commandHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 text-foreground">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          Command History
        </h1>
        <Link href="/">
          <Button variant="outline" className="border-border flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Helm
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">
            Previous Commands
          </CardTitle>

          <div className="font-mono text-sm max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 mt-4">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground">No commands in history</p>
            ) : (
              history.map((entry, idx) => (
                <div key={idx} className="relative flex flex-col space-y-3 p-4 rounded-lg bg-card border border-border shadow-sm mb-4">
                  <div className="absolute top-2 right-2 text-xs text-muted-foreground">
                    {entry.timestamp}
                  </div>

                  {/* Command */}
                  <div className="flex items-start space-x-2 pb-2 border-b border-border">
                    <span className="shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400">
                      CO
                    </span>
                    <span className="text-foreground break-words flex-1 font-medium">{entry.command}</span>
                  </div>

                  {/* Helm Response */}
                  <div className="flex items-start space-x-2 pb-2 border-b border-border">
                    <span className="shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400">
                      HELM
                    </span>
                    <span className="text-muted-foreground break-words flex-1">
                      {entry.helmResponse}
                    </span>
                  </div>

                  {/* Status Update */}
                  <div className="flex items-start space-x-2">
                    <span className="shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400">
                      STATUS
                    </span>
                    <span className="text-muted-foreground break-words flex-1 italic">
                      {entry.statusReport}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 