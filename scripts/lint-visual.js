#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const pagesDir = path.join(root, 'src', 'pages');

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (full.endsWith('.tsx')) files.push(full);
  }
}
walk(pagesDir);

const errors = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    const idx = i + 1;
    // Detecta style inline
    if (line.includes('style={{')) {
      // Gradientes inline
      if (/linear-gradient|radial-gradient/.test(line)) {
        errors.push(`${file}:${idx} — gradiente inline detectado em style`);
      }
      // Cores hardcoded
      if (/#([0-9a-fA-F]{3,8})\b/.test(line) || /rgb\s*\(/.test(line)) {
        errors.push(`${file}:${idx} — cor hardcoded detectada em style`);
      }
    }
  });
}

if (errors.length) {
  console.error('Lint visual falhou:\n' + errors.map(e => ` - ${e}`).join('\n'));
  process.exit(1);
} else {
  console.log('Lint visual OK — nenhum gradiente inline/cor hardcoded em pages.');
}