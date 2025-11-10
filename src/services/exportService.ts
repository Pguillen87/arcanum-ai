import { saveAs } from 'file-saver';

// Tipos de exportação suportados
export type ExportFormat = 'txt' | 'md' | 'json' | 'docx' | 'pdf' | 'srt';

export interface ExportOptions {
  filename?: string;
  mimeType?: string;
}

export interface ExportService {
  exportText(content: string, format: 'txt' | 'md' | 'json', options?: ExportOptions): void;
  exportTranscription(text: string, format: 'txt' | 'md' | 'docx' | 'pdf' | 'srt', options?: ExportOptions): Promise<void>;
  exportTransformation(text: string, format: 'txt' | 'md' | 'json', options?: ExportOptions): void;
}

class ExportServiceImpl implements ExportService {
  /**
   * Exporta texto simples (TXT, MD, JSON)
   */
  exportText(content: string, format: 'txt' | 'md' | 'json', options?: ExportOptions): void {
    const filename = options?.filename || `export-${Date.now()}.${format}`;
    let blob: Blob;
    let mimeType: string;

    switch (format) {
      case 'txt':
        blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        mimeType = 'text/plain';
        break;
      case 'md':
        blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        mimeType = 'text/markdown';
        break;
      case 'json':
        const jsonContent = JSON.stringify({ content, exportedAt: new Date().toISOString() }, null, 2);
        blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
        mimeType = 'application/json';
        break;
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }

    saveAs(blob, filename);
  }

  /**
   * Exporta transcrição (TXT, MD, DOCX, PDF, SRT)
   */
  async exportTranscription(
    text: string,
    format: 'txt' | 'md' | 'docx' | 'pdf' | 'srt',
    options?: ExportOptions
  ): Promise<void> {
    const filename = options?.filename || `transcription-${Date.now()}.${format}`;

    switch (format) {
      case 'txt':
      case 'md':
        this.exportText(text, format, { filename });
        break;
      case 'json':
        this.exportText(text, 'json', { filename });
        break;
      case 'srt':
        this.exportSRT(text, filename);
        break;
      case 'docx':
        await this.exportDOCX(text, filename);
        break;
      case 'pdf':
        await this.exportPDF(text, filename);
        break;
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }
  }

  /**
   * Exporta transformação (TXT, MD, JSON)
   */
  exportTransformation(text: string, format: 'txt' | 'md' | 'json', options?: ExportOptions): void {
    this.exportText(text, format, options);
  }

  /**
   * Exporta como SRT (legendas)
   */
  private exportSRT(text: string, filename: string): void {
    // Converter texto em formato SRT básico
    // Cada parágrafo vira uma legenda de 3 segundos
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    let srtContent = '';

    paragraphs.forEach((paragraph, index) => {
      const startTime = index * 3;
      const endTime = (index + 1) * 3;
      srtContent += `${index + 1}\n`;
      srtContent += `${this.formatSRTTime(startTime)} --> ${this.formatSRTTime(endTime)}\n`;
      srtContent += `${paragraph.trim()}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename);
  }

  /**
   * Formata tempo para SRT (HH:MM:SS,mmm)
   */
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  /**
   * Exporta como DOCX usando biblioteca docx
   * Nota: Requer instalação de 'docx' e 'file-saver'
   */
  private async exportDOCX(text: string, filename: string): Promise<void> {
    try {
      // Importação dinâmica para evitar erro se biblioteca não estiver instalada
      const { Document, Packer, Paragraph, TextRun } = await import('docx');

      const paragraphs = text.split(/\n\n+/).map(
        (para) =>
          new Paragraph({
            children: [
              new TextRun({
                text: para.trim(),
                size: 24, // 12pt
              }),
            ],
            spacing: { after: 200 },
          })
      );

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, filename);
    } catch (error: any) {
      // Fallback: exportar como TXT se DOCX não estiver disponível
      console.warn('Biblioteca docx não disponível, exportando como TXT:', error);
      this.exportText(text, 'txt', { filename: filename.replace('.docx', '.txt') });
      throw new Error('Exportação DOCX requer biblioteca "docx". Exportando como TXT.');
    }
  }

  /**
   * Exporta como PDF usando biblioteca jspdf ou pdfmake
   * Nota: Requer instalação de 'jspdf' ou 'pdfmake'
   */
  private async exportPDF(text: string, filename: string): Promise<void> {
    try {
      // Tentar usar jspdf primeiro
      try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(text, 180); // Largura da página menos margens
        doc.text(lines, 10, 10);
        doc.save(filename);
        return;
      } catch {
        // Se jspdf não estiver disponível, tentar pdfmake
        const pdfMake = await import('pdfmake/build/pdfmake');
        const pdfFonts = await import('pdfmake/build/vfs_fonts');

        if (pdfMake.default && pdfFonts.default) {
          pdfMake.default.vfs = pdfFonts.default.pdfMake.vfs;

          const docDefinition = {
            content: [
              {
                text: text,
                fontSize: 12,
                lineHeight: 1.5,
              },
            ],
            defaultStyle: {
              font: 'Roboto',
            },
          };

          pdfMake.default.createPdf(docDefinition).download(filename);
          return;
        }
      }

      // Fallback: exportar como TXT
      throw new Error('Bibliotecas PDF não disponíveis');
    } catch (error: any) {
      console.warn('Biblioteca PDF não disponível, exportando como TXT:', error);
      this.exportText(text, 'txt', { filename: filename.replace('.pdf', '.txt') });
      throw new Error('Exportação PDF requer biblioteca "jspdf" ou "pdfmake". Exportando como TXT.');
    }
  }
}

export const exportService: ExportService = new ExportServiceImpl();

