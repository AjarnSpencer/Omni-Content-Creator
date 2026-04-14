import fs from 'fs';
import path from 'path';

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      search(fullPath);
    } else if (fullPath.endsWith('.d.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('SpeechConfig') || content.includes('speechConfig')) {
        console.log('Found in', fullPath);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('SpeechConfig')) {
            console.log(lines.slice(Math.max(0, i-5), Math.min(lines.length, i+15)).join('\n'));
          }
        }
      }
    }
  }
}

search(path.resolve('node_modules', '@google', 'genai'));
