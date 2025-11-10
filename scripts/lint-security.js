// Simple security scanner: flags risky patterns in TSX
// - <a target="_blank"> without rel="noopener noreferrer"
// - eval( and new Function(
// - dangerouslySetInnerHTML usage

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const exts = new Set(['.tsx', '.ts']);
let issues = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (exts.has(path.extname(e.name))) scan(full);
  }
}

function scan(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, idx) => {
    // anchor target blank without rel
    if (/\<a[^>]*target=\"_blank\"/i.test(line) && !/rel=\"[^\"]*noopener[^\"]*noreferrer[^\"]*\"/i.test(line)) {
      issues.push({ file, line: idx + 1, msg: 'Anchor target="_blank" sem rel="noopener noreferrer"' });
    }
    if (/\beval\s*\(/.test(line)) {
      issues.push({ file, line: idx + 1, msg: 'Uso de eval() proibido' });
    }
    if (/new\s+Function\s*\(/.test(line)) {
      issues.push({ file, line: idx + 1, msg: 'Uso de new Function() proibido' });
    }
    if (/dangerouslySetInnerHTML\s*=/.test(line) && !file.endsWith(path.join('components','ui','SafeHtml.tsx'))) {
      issues.push({ file, line: idx + 1, msg: 'dangerouslySetInnerHTML detectado — use SafeHtml' });
    }
  });
}

walk(root);

if (issues.length) {
  console.error('Security lint found issues:');
  for (const i of issues) {
    console.error(`- ${i.file}:${i.line} — ${i.msg}`);
  }
  process.exit(1);
} else {
  console.log('Security lint: no issues found.');
}
