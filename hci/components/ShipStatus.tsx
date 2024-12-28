import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface ShipStatusProps {
  rudder: number
  course: number
  speed: number
}

export default function ShipStatus({ rudder, course, speed }: ShipStatusProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="bg-gray-700 border-gray-600">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2 text-center">Rudder</h3>
          <p className="text-2xl font-bold text-center">{rudder}°</p>
          <div className="mt-2 h-4 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${Math.abs(rudder) / 0.35}%`, marginLeft: rudder < 0 ? '0' : 'auto', marginRight: rudder > 0 ? '0' : 'auto' }}
            ></div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gray-700 border-gray-600">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2 text-center">Course</h3>
          <p className="text-2xl font-bold text-center">{course}°</p>
        </CardContent>
      </Card>
      <Card className="bg-gray-700 border-gray-600">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2 text-center">Speed</h3>
          <p className="text-2xl font-bold text-center">{speed} knots</p>
          <div className="mt-2 h-4 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${speed}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

