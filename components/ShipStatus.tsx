import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useTheme } from '@/contexts/ThemeContext'

interface ShipStatusProps {
  rudder: number
  course: number
  speed: number
}

export default function ShipStatus({ rudder, course, speed }: ShipStatusProps) {
  const { theme } = useTheme()
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder} overflow-hidden`}>
        <CardContent className="p-4 relative">
          <div className={`absolute inset-x-0 top-0 h-1 ${theme.indicators.rudder} opacity-75`} />
          <h3 className={`text-sm font-medium mb-1 ${theme.text.muted}`}>Rudder</h3>
          <p className={`text-2xl font-bold ${theme.text.primary}`}>{rudder}°</p>
          <div className={`mt-3 h-2 ${theme.compass.background} rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${theme.indicators.rudder} transition-all duration-300`}
              style={{ 
                width: `${Math.abs(rudder) / 0.35}%`, 
                marginLeft: rudder < 0 ? '0' : 'auto', 
                marginRight: rudder > 0 ? '0' : 'auto' 
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder} overflow-hidden`}>
        <CardContent className="p-4 relative">
          <div className={`absolute inset-x-0 top-0 h-1 ${theme.indicators.course} opacity-75`} />
          <h3 className={`text-sm font-medium mb-1 ${theme.text.muted}`}>Course</h3>
          <p className={`text-2xl font-bold ${theme.text.primary}`}>{course}°</p>
          <div className="mt-3 h-2 opacity-0" />
        </CardContent>
      </Card>

      <Card className={`${theme.colors.cardBackground} ${theme.colors.cardBorder} overflow-hidden`}>
        <CardContent className="p-4 relative">
          <div className={`absolute inset-x-0 top-0 h-1 ${theme.indicators.speed} opacity-75`} />
          <h3 className={`text-sm font-medium mb-1 ${theme.text.muted}`}>Speed</h3>
          <p className={`text-2xl font-bold ${theme.text.primary}`}>{speed} knots</p>
          <div className={`mt-3 h-2 ${theme.compass.background} rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${theme.indicators.speed} transition-all duration-300`}
              style={{ width: `${speed}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

