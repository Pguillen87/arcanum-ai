// Componente de preview dos outputs de transformação
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { Label } from '@/components/ui/label';
import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OutputPreviewProps {
  outputs: {
    text?: string;
    variants?: string[];
  } | null;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string | null;
  onExport?: (format: 'md' | 'txt' | 'json') => void;
  className?: string;
}

export const OutputPreview = ({
  outputs,
  status,
  error,
  onExport,
  className,
}: OutputPreviewProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const exportToFile = (content: string, format: 'md' | 'txt' | 'json', filename: string) => {
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'md' | 'txt' | 'json') => {
    if (!outputs?.text) return;

    let content = '';
    const filename = `transformacao-${Date.now()}`;

    switch (format) {
      case 'md':
        content = outputs.text;
        break;
      case 'txt':
        content = outputs.text.replace(/\n\n/g, '\n');
        break;
      case 'json':
        content = JSON.stringify(outputs, null, 2);
        break;
    }

    exportToFile(content, format, filename);
    onExport?.(format);
  };

  if (status === 'queued' || status === 'processing') {
    return (
      <CosmicCard className={className}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">
            {status === 'queued' ? 'Na fila...' : 'Processando...'}
          </p>
        </div>
        </div>
      </CosmicCard>
    );
  }

  if (status === 'failed') {
    return (
      <CosmicCard className={className}>
        <div className="p-6 space-y-4">
          <div className="text-destructive">
            <h3 className="font-semibold mb-2">Erro na transformação</h3>
            <p className="text-sm">{error || 'Erro desconhecido'}</p>
          </div>
        </div>
      </CosmicCard>
    );
  }

  if (status === 'completed' && outputs?.text) {
    const variants = outputs.variants || [outputs.text];

    return (
      <CosmicCard className={className}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Resultado</h3>
            <div className="flex gap-2">
              <CosmicButton
                size="sm"
                variant="outline"
                onClick={() => handleCopy(outputs.text!)}
                aria-label="Copiar texto"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </CosmicButton>
              <CosmicButton
                size="sm"
                variant="outline"
                onClick={() => handleExport('md')}
                aria-label="Exportar como Markdown"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </CosmicButton>
            </div>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={index} className="space-y-2">
                {variants.length > 1 && (
                  <Label className="text-sm text-muted-foreground">Variante {index + 1}</Label>
                )}
                <div className="p-4 glass-cosmic rounded-lg border border-border/30">
                  <SafeHtml html={variant.replace(/\n/g, '<br />')} />
                </div>
                <div className="flex gap-2">
                  <CosmicButton
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(variant)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </CosmicButton>
                  <CosmicButton
                    size="sm"
                    variant="ghost"
                    onClick={() => handleExport('md')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    .md
                  </CosmicButton>
                  <CosmicButton
                    size="sm"
                    variant="ghost"
                    onClick={() => handleExport('txt')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    .txt
                  </CosmicButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CosmicCard>
    );
  }

  return null;
};

