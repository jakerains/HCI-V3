import { Card, CardContent } from '@/components/ui/card'

interface ShipStatusProps {
  rudder: number
  course: number
  speed: number
}

export function ShipStatus({ rudder, course, speed }: ShipStatusProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Rudder Status */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-blue-500 opacity-75" />
          <h3 className="text-sm font-medium mb-1 text-muted-foreground">Rudder</h3>
          <p className="text-2xl font-bold text-foreground">{rudder}°</p>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${Math.abs(rudder) / 35 * 100}%`,
                marginLeft: rudder < 0 ? 'auto' : undefined,
              }}
            />
          </div>
        </div>

        {/* Course Status */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-yellow-500 opacity-75" />
          <h3 className="text-sm font-medium mb-1 text-muted-foreground">Course</h3>
          <p className="text-2xl font-bold text-foreground">{course}°</p>
        </div>

        {/* Speed Status */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-green-500 opacity-75" />
          <h3 className="text-sm font-medium mb-1 text-muted-foreground">Speed</h3>
          <p className="text-2xl font-bold text-foreground">{speed} knots</p>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${Math.abs(speed) / 20 * 100}%`,
                marginLeft: speed < 0 ? 'auto' : undefined,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

