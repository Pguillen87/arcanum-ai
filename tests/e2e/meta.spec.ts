import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Metadados — lang e manifest', () => {
  it('index.html define lang pt-BR e possui manifest', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    expect(html).toMatch(/<html\s+lang="pt-BR"/);
    expect(html).toMatch(/<link\s+rel="manifest"\s+href="\/manifest.json"\s*\/>/);
  });
});