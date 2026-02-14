import { readFileSync } from 'fs'
import { join } from 'path'

export async function handler() {
  try {
    // Find the project root and serve the HTML file
    let projectRoot
    let currentDir = process.cwd()
    
    // Walk up to find public/html/arc-viewer-page.html
    for (let i = 0; i < 5; i++) {
      const candidate = join(currentDir, 'public', 'html', 'arc-viewer-page.html')
      try {
        readFileSync(candidate, 'utf-8')
        projectRoot = currentDir
        break
      } catch (e) {
        currentDir = join(currentDir, '..')
      }
    }
    
    // Default to /workspace
    if (!projectRoot) {
      projectRoot = '/workspace'
    }
    
    const htmlPath = join(projectRoot, 'public', 'html', 'arc-viewer-page.html')
    const html = readFileSync(htmlPath, 'utf-8')
    
    return {
      statusCode: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: html
    }
  } catch (error) {
    console.error('Error serving Arc Viewer page:', error)
    return {
      statusCode: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            h1 { color: #d32f2f; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <h1>Failed to Load Arc Viewer</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `
    }
  }
}
