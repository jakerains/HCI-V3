import { NextResponse } from 'next/server'
import { addNewTheme } from '@/lib/theme-manager'

export async function POST(request: Request) {
  try {
    const { name, theme } = await request.json()
    
    if (!name || !theme) {
      return NextResponse.json(
        { error: 'Name and theme are required' },
        { status: 400 }
      )
    }

    const result = await addNewTheme(name, theme)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add theme' },
      { status: 500 }
    )
  }
} 