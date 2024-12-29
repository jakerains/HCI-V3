'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { commandStore, CommandEntry } from '@/lib/commandStore'

export default function CommandHistory() {
  const { theme } = useTheme()
  const [commands, setCommands] = useState<CommandEntry[]>([])

  useEffect(() => {
    const history = commandStore.getCommands()
    setCommands(history)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <div className={`w-full max-w-6xl mx-auto p-4 sm:p-6 ${theme.text.primary}`}>
        <div className="flex items-center justify-between mb-6">
          <h1 className={`${theme.fonts.display} text-2xl sm:text-3xl font-bold ${theme.text.primary}`}>
            Command History
          </h1>
          <Link href="/">
            <Button variant="outline" className={`${theme.colors.cardBorder} flex items-center gap-2`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Helm
            </Button>
          </Link>
        </div>

        <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-lg sm:text-xl font-semibold ${theme.text.primary}`}>
              Previous Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-4 ${theme.fonts.mono} text-sm max-h-[calc(100vh-12rem)] overflow-y-auto pr-2`}>
              {commands.length === 0 ? (
                <p className={`text-center ${theme.text.muted}`}>No commands in history</p>
              ) : (
                commands.map((entry, idx) => (
                  <div key={idx} className={`relative flex flex-col space-y-3 p-4 rounded-lg ${theme.colors.cardBackground} border ${theme.colors.cardBorder} shadow-sm`}>
                    {/* Timestamp */}
                    <div className={`absolute top-2 right-2 text-xs ${theme.text.muted}`}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    
                    {/* CO Command */}
                    <div className={`flex items-start space-x-2 pb-2 border-b ${theme.colors.cardBorder}`}>
                      <span className={`shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400`}>
                        CO
                      </span>
                      <span className={`${theme.text.primary} break-words flex-1 font-medium`}>{entry.command}</span>
                    </div>
                    
                    {/* Helm Response */}
                    <div className={`flex items-start space-x-2 pb-2 border-b ${theme.colors.cardBorder}`}>
                      <span className={`shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400`}>
                        HELM
                      </span>
                      <span className={`${theme.text.secondary} break-words flex-1`}>
                        {entry.helmResponse}
                      </span>
                    </div>
                    
                    {/* Status Update */}
                    <div className="flex items-start space-x-2">
                      <span className={`shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400`}>
                        STATUS
                      </span>
                      <span className={`${theme.text.muted} break-words flex-1 italic`}>
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
    </div>
  )
} 