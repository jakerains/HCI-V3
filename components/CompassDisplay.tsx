'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface CompassDisplayProps {
  course?: number
}

export default function CompassDisplay({ course = 0 }: CompassDisplayProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [displayCourse, setDisplayCourse] = useState(course)
  
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

  // Update displayCourse when course prop changes
  useEffect(() => {
    if (mounted) {
      console.log('CompassDisplay - Course prop updated:', course)
      console.log('CompassDisplay - Setting displayCourse to:', course)
      setDisplayCourse(Number(course))
    }
  }, [course, mounted])

  // Handle initial mount
  useEffect(() => {
    setMounted(true)
    setDisplayCourse(Number(course))
  }, [])

  if (!mounted) {
    return null
  }

  // Normalize course to 0-360 range
  const normalizedCourse = ((Number(displayCourse) % 360) + 360) % 360
  console.log('CompassDisplay - Normalized course:', normalizedCourse)

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
          className="absolute inset-6 transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${normalizedCourse}deg)` }}
        >
          {/* Compass card with degree markings */}
          <div className="absolute inset-0 rounded-full">
            {/* North pointer with bar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="relative w-full"
                style={{ transform: `rotate(-90deg)` }}
              >
                {/* Horizontal bar */}
                <div className="relative h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-500/80 to-amber-500/20">
                  {/* North triangle - positioned at end of bar */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90">
                    <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-amber-500/80" />
                  </div>
                </div>
              </div>
            </div>

            {/* Center hub */}
            <div className={`absolute inset-[45%] rounded-full ${theme.compass.background} shadow-md border ${theme.colors.cardBorder}`}>
              <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-gray-400/5 to-gray-400/20" />
            </div>
          </div>
        </div>

        {/* Digital readout */}
        <div className={`absolute left-1/2 -translate-x-1/2 bottom-6 ${theme.colors.cardBackground} px-2 py-0.5 rounded border ${theme.colors.cardBorder} shadow-lg backdrop-blur-sm`}>
          <span className={`text-base font-mono font-bold ${theme.text.primary}`}>
            {normalizedCourse.toFixed(0)}°
          </span>
        </div>
      </div>
    </div>
  )
}

