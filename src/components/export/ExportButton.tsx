import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, File, FileJson, FileType, FileImage, Loader2 } from 'lucide-react';
import { exportService, type ExportFormat } from '@/services/exportService';
import { toast } from 'sonner';

export interface ExportButtonProps {
  content: string;
  type: 'transcription' | 'transformation';
  defaultFilename?: string;
  formats?: ExportFormat[];
}

const formatIcons: Record<string, React.ReactNode> = {
  txt: <FileText className="w-4 h-4" />,
  md: <FileType className="w-4 h-4" />,
  json: <FileJson className="w-4 h-4" />,
  docx: <File className="w-4 h-4" />,
  pdf: <FileImage className="w-4 h-4" />,
  srt: <FileText className="w-4 h-4" />,
};

const formatLabels: Record<string, string> = {
  txt: 'Texto (TXT)',
  md: 'Markdown (MD)',
  json: 'JSON',
  docx: 'Word (DOCX)',
  pdf: 'PDF',
  srt: 'Legendas (SRT)',
};

export function ExportButton({ content, type, defaultFilename, formats }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const availableFormats: ExportFormat[] = formats || (
    type === 'transcription'
      ? ['txt', 'md', 'docx', 'pdf', 'srt']
      : ['txt', 'md', 'json']
  );

  const handleExport = async (format: ExportFormat) => {
    if (!content || content.trim().length === 0) {
      toast.error('Nenhum conteúdo para exportar');
      return;
    }

    setIsExporting(true);
    const filename = defaultFilename || `${type}-${Date.now()}`;

    try {
      if (type === 'transcription') {
        await exportService.exportTranscription(content, format as any, { filename: `${filename}.${format}` });
      } else {
        exportService.exportTransformation(content, format as any, { filename: `${filename}.${format}` });
      }

      toast.success('Exportação concluída', {
        description: `Arquivo ${formatLabels[format]} baixado com sucesso`,
      });
    } catch (error: any) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar', {
        description: error?.message || 'Não foi possível exportar o arquivo',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting || !content || content.trim().length === 0}>
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableFormats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            disabled={isExporting}
            className="cursor-pointer"
          >
            <span className="mr-2">{formatIcons[format]}</span>
            {formatLabels[format]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

