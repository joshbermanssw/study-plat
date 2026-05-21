import fs from 'node:fs';
import { compile } from '/Users/josh/Desktop/study-platform/node_modules/.pnpm/@mdx-js+mdx@3.1.1/node_modules/@mdx-js/mdx/index.js';

const file = process.argv[2];
const raw = fs.readFileSync(file, 'utf8');
const m = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
const body = m ? m[1] : raw;

try {
  await compile(body, { development: false });
  console.log('OK');
} catch (e) {
  console.log('ERROR:', e.message);
  console.log('  place:', JSON.stringify(e.place));
  if (e.place?.start) {
    const line = e.place.start.line;
    const lines = body.split('\n');
    console.log('  ±2 context:');
    for (let i = Math.max(0, line-3); i < Math.min(lines.length, line+2); i++) {
      console.log(`    ${i+1}: ${lines[i]}`);
    }
  }
}
