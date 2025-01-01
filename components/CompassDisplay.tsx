'use client'

import { useEffect, useState } from 'react'

interface CompassDisplayProps {
  course?: number
}

export function CompassDisplay({ course = 0 }: CompassDisplayProps) {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    setRotation(-course)
  }, [course])

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto">
      {/* Compass Rose */}
      <div 
        className="absolute inset-0 rounded-full border-2 border-border bg-card"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Cardinal Points */}
        {['N', 'E', 'S', 'W'].map((point, index) => (
          <div
            key={point}
            className="absolute inset-0 flex items-center justify-center text-foreground font-mono font-bold"
            style={{ transform: `rotate(${index * 90}deg)` }}
          >
            <span className="absolute -top-1">{point}</span>
          </div>
        ))}

        {/* Degree Markers */}
        {Array.from({ length: 72 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{ transform: `rotate(${i * 5}deg)` }}
          >
            <div 
              className={`absolute top-0 left-1/2 w-0.5 h-2 -translate-x-1/2 bg-muted-foreground ${
                i % 18 === 0 ? 'h-3' : ''
              }`}
            />
          </div>
        ))}
      </div>

      {/* Center Point */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-destructive" />
      </div>

      {/* Heading Marker */}
      <div className="absolute inset-x-0 top-0">
        <div className="w-0 h-0 mx-auto border-8 border-transparent border-t-destructive" />
      </div>
    </div>
  )
}

