// Ticker místico: exibe "receitas de magia" extraídas do documento de design
// Usa import de markdown cru com Vite (?raw).
import React, { useMemo } from 'react';
// @ts-ignore - import de arquivo não TS com ?raw
import mysticDoc from '../../../docs/excencial/desing.md?raw';

function extractRecipes(doc: string): string[] {
  const lines = doc.split('\n');
  const candidates: string[] = [];
  // Extrair bullets e frases inspiracionais
  for (const l of lines) {
    const line = l.trim();
    if (line.startsWith('*') || line.startsWith('-') || line.includes('✨') || line.includes('💡')) {
      candidates.push(line.replace(/^[-*]\s*/, ''));
    }
    // Títulos poéticos como receitas
    if (/^##+\s+/.test(line)) {
      candidates.push(line.replace(/^##+\s+/, 'Ritual: '));
    }
  }
  // Fallback: algumas frases fixas se nada encontrado
  if (candidates.length === 0) {
    candidates.push('Misture cristais de foco com sopros de inspiração lunar.');
    candidates.push('Agite o grimório e deixe o verbo transmutar-se em texto.');
    candidates.push('Pingue três dracmas de concentração no caldeirão das ideias.');
  }
  // Limitar e remover duplicatas
  return Array.from(new Set(candidates)).slice(0, 12);
}

export function MysticRecipeTicker() {
  const recipes = useMemo(() => extractRecipes(mysticDoc), []);
  return (
    <div className="overflow-hidden rounded-md border border-primary/20 bg-card/40">
      <div className="flex gap-6 animate-[marquee_24s_linear_infinite] p-3 text-sm text-muted-foreground">
        {recipes.map((r, idx) => (
          <div key={idx} className="whitespace-nowrap">{r}</div>
        ))}
      </div>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
      `}</style>
    </div>
  );
}

