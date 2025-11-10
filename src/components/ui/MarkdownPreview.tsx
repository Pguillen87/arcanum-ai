// Componente simples para visualização de Markdown sem dependências externas.
// Converte um subconjunto de Markdown (títulos, listas, parágrafos, código inline) em elementos React.
// Usa sanitize para evitar HTML perigoso.
import React from 'react';
import { sanitizeHTML } from '@/lib/sanitize';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

// Conversor minimalista de Markdown → HTML seguro
function toHtml(md: string): string {
  let html = md;
  // Code inline: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Headings: #, ##, ###
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  // Unordered lists: - item / * item
  // Agrupar linhas consecutivas começando com - ou * em <ul>
  html = html.replace(/^(?:-|\*)\s+.+(?:\n(?:-|\*)\s+.+)*$/gm, (block) => {
    const items = block.split('\n').map((line) => line.replace(/^(?:-|\*)\s+/, ''));
    return '<ul>' + items.map((it) => `<li>${it}</li>`).join('') + '</ul>';
  });
  // Parágrafos: linhas isoladas
  html = html.replace(/^(?!<h\d>|<ul>|<li>|<code>|<strong>|<em>)(.+)$/gm, '<p>$1</p>');
  return html;
}

export function MarkdownPreview({ markdown, className }: MarkdownPreviewProps) {
  const safe = sanitizeHTML(toHtml(markdown));
  return (
    <div className={`prose prose-sm text-foreground ${className || ''}`}
         dangerouslySetInnerHTML={{ __html: safe }} />
  );
}
