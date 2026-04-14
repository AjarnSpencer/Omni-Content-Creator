import { execSync } from 'child_process';

try {
  const output = execSync('git log -p services/geminiService.ts', { encoding: 'utf-8' });
  const lines = output.split('\n');
  let inGenerateSpeech = false;
  let count = 0;
  for (const line of lines) {
    if (line.includes('export const generateSpeech')) {
      inGenerateSpeech = true;
      console.log('--- NEW MATCH ---');
    }
    if (inGenerateSpeech) {
      console.log(line);
      count++;
      if (count > 20) {
        inGenerateSpeech = false;
        count = 0;
      }
    }
  }
} catch (e) {
  console.log("No git");
}
