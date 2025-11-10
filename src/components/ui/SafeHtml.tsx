import React from 'react';
import { sanitizeHTML } from '@/lib/sanitize';

interface SafeHtmlProps {
  html: string;
}

// Único ponto permitido de dangerouslySetInnerHTML, com sanitização obrigatória
export const SafeHtml: React.FC<SafeHtmlProps> = ({ html }) => {
  const clean = sanitizeHTML(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
};

