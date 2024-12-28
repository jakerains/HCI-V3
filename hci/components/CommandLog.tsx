import React from 'react'

interface CommandLogProps {
  commands: string[]
}

export default function CommandLog({ commands }: CommandLogProps) {
  return (
    <ul className="space-y-2">
      {commands.map((command, index) => (
        <li key={index} className="text-sm text-gray-300">
          <span className="font-mono text-green-400">{`>`}</span> {command}
        </li>
      ))}
    </ul>
  )
}

