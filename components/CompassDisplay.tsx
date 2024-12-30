'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface CompassDisplayProps {
  course?: number
}

export default function CompassDisplay({ course = 0 }: CompassDisplayProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Cardinal and ordinal directions
  const directions = [
    { deg: 0, label: 'N' },
    { deg: 45, label: 'NE' },
    { deg: 90, label: 'E' },
    { deg: 135, label: 'SE' },
    { deg: 180, label: 'S' },
    { deg: 225, label: 'SW' },
    { deg: 270, label: 'W' },
    { deg: 315, label: 'NW' },
  ]

  // Generate tick marks for every 5 degrees
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5)

  // Normalize course to 0-360 range
  const normalizedCourse = ((course % 360) + 360) % 360

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Prevent hydration mismatch by not rendering anything on server
  }

  return (
    <div className="relative w-full aspect-square max-w-[240px] mx-auto">
      {/* Background circle with gradient */}
      <div className={`absolute inset-0 rounded-full ${theme.compass.background} shadow-inner ring-1 ${theme.colors.cardBorder}`}>
        {/* Background bar */}
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 ${theme.indicators.course} opacity-20`} />
      </div>
      
      {/* Outer ring with subtle glow */}
      <div className={`absolute inset-1 rounded-full border ${theme.colors.cardBorder} shadow-lg backdrop-blur-sm bg-opacity-20`}>
        {/* Fixed compass card */}
        <div className="absolute inset-0">
          {/* Tick marks */}
          {ticks.map((deg) => {
            const isMajor = deg % 30 === 0;
            const isMinor = deg % 10 === 0;
            return (
              <div
                key={deg}
                className="absolute inset-0"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div
                  className={`absolute top-0 left-1/2 transform -translate-x-1/2 ${
                    isMajor 
                      ? `h-2 w-[1px] ${theme.compass.markers} opacity-60` 
                      : isMinor
                        ? `h-1.5 w-[1px] ${theme.compass.markers} opacity-40`
                        : `h-1 w-[1px] ${theme.compass.markers} opacity-20`
                  }`}
                />
              </div>
            );
          })}

          {/* Cardinal and ordinal directions */}
          {directions.map(({ deg, label }) => (
            <div
              key={deg}
              className="absolute inset-0"
              style={{ transform: `rotate(${deg}deg)` }}
            >
              <div
                className={`absolute top-3 left-1/2 transform -translate-x-1/2 text-[10px] font-medium ${theme.compass.text}`}
                style={{ transform: `rotate(-${deg}deg)` }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Inner bezel with metallic effect */}
        <div className={`absolute inset-4 rounded-full border ${theme.colors.cardBorder} bg-gradient-to-br from-gray-500/10 to-gray-900/10`} />

        {/* Fixed reference marker at top */}
        <div className="absolute inset-x-0 top-0 flex justify-center">
          <div className={`h-2 w-[1px] ${theme.compass.markers}`} />
        </div>

        {/* Rotating compass card */}
        <div
          className="absolute inset-6 transition-transform duration-500 ease-out"
          style={{ transform: mounted ? `rotate(-${normalizedCourse}deg)` : 'rotate(0deg)' }}
        >
          {/* Compass card with degree markings */}
          <div className="absolute inset-0 rounded-full">
            {/* North pointer with triangle */}
            <div className="absolute inset-x-0 top-0 flex justify-center">
              <div className="relative flex flex-col items-center">
                {/* Triangle pointer */}
                <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-amber-500/90" />
                {/* Main needle */}
                <div className={`w-0.5 h-[40%] bg-gradient-to-b from-amber-500/90 to-amber-500/40 rounded-full -mt-1`} />
                {/* Dynamic bar with gradient and glow */}
                <div className="absolute top-[50%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-[2px] h-[100px] bg-gradient-to-b from-amber-500/70 to-amber-500/20 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                </div>
              </div>
            </div>
            {/* South pointer */}
            <div className="absolute inset-x-0 bottom-0 flex justify-center">
              <div className="w-0.5 h-[40%] bg-gradient-to-t from-gray-300/80 to-white/80 rounded-full" />
            </div>
            
            {/* East-West line */}
            <div className="absolute inset-y-0 left-1/2 flex justify-center">
              <div className={`h-full w-[1px] ${theme.compass.markers} opacity-40`} />
            </div>

            {/* Center hub */}
            <div className={`absolute inset-[45%] rounded-full ${theme.compass.background} shadow-lg border ${theme.colors.cardBorder}`} />
          </div>
        </div>

        {/* Digital readout */}
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-6 ${theme.colors.cardBackground} px-2 py-0.5 rounded border ${theme.colors.cardBorder} shadow-lg backdrop-blur-sm`}>
          <span className={`text-base font-mono font-bold ${theme.text.primary}`}>
            {normalizedCourse.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  )
}

