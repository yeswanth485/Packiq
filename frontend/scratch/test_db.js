const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\ryesw\\.gemini\\antigravity\\brain\\45726e85-785e-42a4-ad62-e1ff4f207a2c\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.toLowerCase().includes('mlobtimizer') || line.toLowerCase().includes('xgboost') || line.toLowerCase().includes('prompt 2') || line.toLowerCase().includes('scoring model')) {
      // Print first 500 chars of the matching lines to avoid overwhelming output
      console.log(`Line ${lineCount} matches:`, line.substring(0, 300) + '...');
      if (line.includes('mlOptimizer.ts') && line.length > 1000) {
        console.log(`Found a very long match with content of size: ${line.length}`);
        fs.writeFileSync(path.join(__dirname, 'found_log.json'), line);
      }
    }
  }
  console.log('Search finished.');
}
main();
