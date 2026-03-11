import { readFileSync } from 'fs'
import { join } from 'path'
import parser from '@architect/parser'

export async function handler() {
  try {
    // Find app.arc - it should be in the project root or parent directories
    let arcPath
    let currentDir = process.cwd()
    
    // Walk up to find app.arc
    for (let i = 0; i < 5; i++) {
      const candidate = join(currentDir, 'app.arc')
      try {
        readFileSync(candidate, 'utf-8')
        arcPath = candidate
        break
      } catch (e) {
        currentDir = join(currentDir, '..')
      }
    }
    
    if (!arcPath) {
      // Default to /workspace/app.arc
      arcPath = '/workspace/app.arc'
    }
    
    const arcContent = readFileSync(arcPath, 'utf-8')
    
    const parsed = parser(arcContent)
    
    // Extract relevant structure
    const response = {
      app: parsed.app?.[0] || 'app',
      routes: (parsed.http || []).map(route => ({
        method: route[0],
        path: route[1],
        functionName: route[2],
      })),
      lambdas: (parsed.lambda || []).map(lambda => ({
        name: lambda[0],
      })),
      tables: (parsed.tables || []).map(table => ({
        name: table[0],
        attributes: table.slice(1).filter(attr => attr && attr[0] === '*' || attr[0]),
      })),
      functions: (parsed.functions || []).map(fn => ({
        name: fn[0],
        folder: fn[1],
      })),
    }
    
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(response)
    }
  } catch (error) {
    console.error('Error parsing Arc file:', error)
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to parse Arc file',
        message: error.message,
      })
    }
  }
}
