import React from 'react'

interface CompassDisplayProps {
  course: number
}

export default function CompassDisplay({ course }: CompassDisplayProps) {
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
  ];

  // Generate tick marks for every 5 degrees
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      {/* Outer ring */}
      <div className="absolute w-56 h-56 rounded-full border-4 border-gray-600 flex items-center justify-center">
        {/* Tick marks */}
        {ticks.map((deg) => {
          const isMajor = deg % 30 === 0;
          return (
            <div
              key={deg}
              className={`absolute h-full w-full`}
              style={{ transform: `rotate(${deg}deg)` }}
            >
              <div
                className={`absolute top-0 left-1/2 transform -translate-x-1/2 ${
                  isMajor ? 'h-3 w-1 bg-gray-400' : 'h-2 w-0.5 bg-gray-600'
                }`}
              />
            </div>
          );
        })}

        {/* Cardinal and ordinal directions */}
        {directions.map(({ deg, label }) => (
          <div
            key={deg}
            className="absolute w-full h-full"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <div
              className="absolute top-2 left-1/2 transform -translate-x-1/2 text-lg font-bold text-blue-400"
              style={{ transform: `rotate(-${deg}deg)` }}
            >
              {label}
            </div>
          </div>
        ))}

        {/* Rotating compass rose */}
        <div
          className="absolute w-48 h-48 transition-transform duration-300 ease-out"
          style={{ transform: `rotate(-${course}deg)` }}
        >
          {/* North pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-3 h-16 bg-gradient-to-t from-red-600 to-red-500 rounded-t-full" />
          </div>
          {/* South pointer */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <div className="w-3 h-16 bg-gradient-to-b from-white to-gray-300 rounded-b-full" />
          </div>
        </div>

        {/* Digital readout */}
        <div className="absolute bottom-12 bg-gray-800 px-3 py-1 rounded-lg border border-gray-600">
          <span className="text-2xl font-mono font-bold text-blue-400">
            {course.toString().padStart(3, '0')}°
          </span>
        </div>
      </div>
    </div>
  )
}

