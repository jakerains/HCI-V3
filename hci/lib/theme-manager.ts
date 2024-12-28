import fs from 'fs'
import path from 'path'
import { Theme } from './themes'

export async function addNewTheme(themeName: string, themeCode: string) {
  try {
    // Parse the theme code to validate it
    const themeObject = eval(`(${themeCode})`) as Theme
    
    // Read the current themes file
    const themesFilePath = path.join(process.cwd(), 'lib', 'themes.ts')
    const currentContent = await fs.promises.readFile(themesFilePath, 'utf-8')
    
    // Create new theme entry
    const newThemeEntry = `  ${themeName}: ${themeCode},\n`
    
    // Insert the new theme before the last closing brace
    const updatedContent = currentContent.replace(
      /}(\s*)$/,
      `${newThemeEntry}}`
    )
    
    // Write back to themes.ts
    await fs.promises.writeFile(themesFilePath, updatedContent, 'utf-8')
    
    return { success: true, message: `Theme '${themeName}' added successfully` }
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to add theme: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 