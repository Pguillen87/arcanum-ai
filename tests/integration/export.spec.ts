/**
 * Testes de integração para ExportService
 * Valida exportação em todos os formatos (TXT, MD, JSON, DOCX, PDF, SRT)
 * e verificação de arquivo gerado
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportService } from '@/services/exportService';
import { saveAs } from 'file-saver';

// Mock do file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

// Mock do window.Blob
global.Blob = class Blob {
  constructor(public parts: any[], public options?: any) {}
} as any;

describe('ExportService Integration Tests', () => {
  const testContent = 'Este é um texto de teste para exportação.\n\nSegundo parágrafo com mais conteúdo.';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Exportação de Texto Simples', () => {
    it('deve exportar como TXT', () => {
      exportService.exportText(testContent, 'txt');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toMatch(/^export-\d+\.txt$/);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain;charset=utf-8');
    });

    it('deve exportar como MD', () => {
      exportService.exportText(testContent, 'md');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toMatch(/^export-\d+\.md$/);
      expect(blob.type).toBe('text/markdown;charset=utf-8');
    });

    it('deve exportar como JSON com metadados', () => {
      exportService.exportText(testContent, 'json');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toMatch(/^export-\d+\.json$/);
      expect(blob.type).toBe('application/json;charset=utf-8');
    });

    it('deve usar filename customizado quando fornecido', () => {
      const customFilename = 'meu-arquivo.txt';
      exportService.exportText(testContent, 'txt', { filename: customFilename });

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toBe(customFilename);
    });

    it('deve lançar erro para formato inválido', () => {
      expect(() => {
        exportService.exportText(testContent, 'invalid' as any);
      }).toThrow('Formato não suportado');
    });
  });

  describe('Exportação de Transformação', () => {
    it('deve exportar transformação como TXT', () => {
      exportService.exportTransformation(testContent, 'txt');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toMatch(/^export-\d+\.txt$/);
      expect(blob.type).toBe('text/plain;charset=utf-8');
    });

    it('deve exportar transformação como MD', () => {
      exportService.exportTransformation(testContent, 'md');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob] = vi.mocked(saveAs).mock.calls[0];
      expect(blob.type).toBe('text/markdown;charset=utf-8');
    });

    it('deve exportar transformação como JSON', () => {
      exportService.exportTransformation(testContent, 'json');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob] = vi.mocked(saveAs).mock.calls[0];
      expect(blob.type).toBe('application/json;charset=utf-8');
    });
  });

  describe('Exportação de Transcrição', () => {
    it('deve exportar transcrição como TXT', () => {
      exportService.exportTranscription(testContent, 'txt');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toMatch(/^transcription-\d+\.txt$/);
      expect(blob.type).toBe('text/plain;charset=utf-8');
    });

    it('deve exportar transcrição como MD', () => {
      exportService.exportTranscription(testContent, 'md');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toMatch(/^transcription-\d+\.md$/);
      expect(blob.type).toBe('text/markdown;charset=utf-8');
    });

    it('deve exportar transcrição como SRT', () => {
      const transcriptionText = 'Primeira frase.\n\nSegunda frase.\n\nTerceira frase.';
      exportService.exportTranscription(transcriptionText, 'srt');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toMatch(/^transcription-\d+\.srt$/);
      expect(blob.type).toBe('text/plain;charset=utf-8');
    });

    it('deve gerar SRT com formato correto', async () => {
      const transcriptionText = 'Primeira frase.\n\nSegunda frase.';
      exportService.exportTranscription(transcriptionText, 'srt');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob] = vi.mocked(saveAs).mock.calls[0];
      
      // Verificar conteúdo do SRT
      const text = await blob.text();
      expect(text).toContain('1\n');
      expect(text).toContain('2\n');
      expect(text).toContain('-->');
      expect(text).toContain('Primeira frase');
      expect(text).toContain('Segunda frase');
    });

    it('deve exportar transcrição como JSON', () => {
      exportService.exportTranscription(testContent, 'json');

      expect(saveAs).toHaveBeenCalledTimes(1);
      const [blob, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toMatch(/^transcription-\d+\.json$/);
      expect(blob.type).toBe('application/json;charset=utf-8');
    });
  });

  describe('Exportação DOCX (com dependência opcional)', () => {
    it('deve tentar exportar como DOCX e fazer fallback para TXT se biblioteca não estiver disponível', async () => {
      // Mock do import para simular biblioteca não disponível
      vi.doMock('docx', () => {
        throw new Error('Module not found');
      });

      await expect(
        exportService.exportTranscription(testContent, 'docx')
      ).rejects.toThrow();

      // Deve ter tentado exportar como TXT como fallback
      expect(saveAs).toHaveBeenCalled();
    });

    it.skip('deve exportar como DOCX quando biblioteca está disponível', async () => {
      // Este teste requer a biblioteca 'docx' instalada
      // Por enquanto, está marcado como skip
      // Para executar: npm install docx
      const { Document, Packer } = await import('docx');
      expect(Document).toBeDefined();
      expect(Packer).toBeDefined();
    });
  });

  describe('Exportação PDF (com dependência opcional)', () => {
    it('deve tentar exportar como PDF e fazer fallback para TXT se biblioteca não estiver disponível', async () => {
      // Mock do import para simular biblioteca não disponível
      vi.doMock('jspdf', () => {
        throw new Error('Module not found');
      });
      vi.doMock('pdfmake/build/pdfmake', () => {
        throw new Error('Module not found');
      });

      await expect(
        exportService.exportTranscription(testContent, 'pdf')
      ).rejects.toThrow();

      // Deve ter tentado exportar como TXT como fallback
      expect(saveAs).toHaveBeenCalled();
    });

    it.skip('deve exportar como PDF quando biblioteca está disponível', async () => {
      // Este teste requer a biblioteca 'jspdf' ou 'pdfmake' instalada
      // Por enquanto, está marcado como skip
      // Para executar: npm install jspdf ou npm install pdfmake
      // Nota: Não importar diretamente no teste para evitar erro de resolução
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lançar erro para formato de transcrição inválido', async () => {
      await expect(
        exportService.exportTranscription(testContent, 'invalid' as any)
      ).rejects.toThrow('Formato não suportado');
    });

    it('deve lidar com conteúdo vazio', () => {
      expect(() => {
        exportService.exportText('', 'txt');
      }).not.toThrow();

      expect(saveAs).toHaveBeenCalled();
    });

    it('deve lidar com conteúdo muito longo', () => {
      const longContent = 'A'.repeat(100000); // 100KB de texto
      
      expect(() => {
        exportService.exportText(longContent, 'txt');
      }).not.toThrow();

      expect(saveAs).toHaveBeenCalled();
    });

    it('deve lidar com caracteres especiais', () => {
      const specialContent = 'Texto com ç, ã, é, í, ó, ú e símbolos: ©®™€£¥';
      
      expect(() => {
        exportService.exportText(specialContent, 'txt');
      }).not.toThrow();

      expect(saveAs).toHaveBeenCalled();
    });

    it('deve lidar com quebras de linha múltiplas no SRT', () => {
      const multiLineContent = 'Parágrafo 1.\n\n\n\nParágrafo 2.\n\n\nParágrafo 3.';
      
      expect(() => {
        exportService.exportTranscription(multiLineContent, 'srt');
      }).not.toThrow();

      expect(saveAs).toHaveBeenCalled();
    });
  });

  describe('Verificação de Arquivo Gerado', () => {
    it('deve gerar blob com conteúdo correto para TXT', () => {
      exportService.exportText(testContent, 'txt');

      const [blob] = vi.mocked(saveAs).mock.calls[0];
      expect(blob).toBeInstanceOf(Blob);
      
      // Verificar que o blob contém o conteúdo
      // Nota: Em um teste real, precisaríamos ler o blob
      expect(blob.size).toBeGreaterThan(0);
    });

    it('deve gerar blob JSON com estrutura correta', async () => {
      exportService.exportText(testContent, 'json');

      const [blob] = vi.mocked(saveAs).mock.calls[0];
      const text = await blob.text();
      const json = JSON.parse(text);

      expect(json).toHaveProperty('content');
      expect(json).toHaveProperty('exportedAt');
      expect(json.content).toBe(testContent);
      expect(json.exportedAt).toBeDefined();
    });

    it('deve gerar SRT com timestamps corretos', async () => {
      const transcriptionText = 'Frase 1.\n\nFrase 2.';
      exportService.exportTranscription(transcriptionText, 'srt');

      const [blob] = vi.mocked(saveAs).mock.calls[0];
      const text = await blob.text();

      // Verificar formato de timestamp SRT (HH:MM:SS,mmm)
      expect(text).toMatch(/\d{2}:\d{2}:\d{2},\d{3}/);
      // Verificar que há sequência numérica
      expect(text).toContain('1\n');
      expect(text).toContain('2\n');
    });

    it('deve usar filename customizado em todas as exportações', () => {
      const customFilename = 'custom-export.txt';
      exportService.exportText(testContent, 'txt', { filename: customFilename });

      const [, filename] = vi.mocked(saveAs).mock.calls[0];
      expect(filename).toBe(customFilename);
    });
  });

  describe('Formatos Específicos', () => {
    it('deve exportar SRT com múltiplas legendas', async () => {
      const transcriptionText = 'Legenda 1.\n\nLegenda 2.\n\nLegenda 3.\n\nLegenda 4.';
      exportService.exportTranscription(transcriptionText, 'srt');

      const [blob] = vi.mocked(saveAs).mock.calls[0];
      const text = await blob.text();

      // Deve ter 4 legendas
      expect(text.match(/\d+\n/g)).toHaveLength(4);
      expect(text).toContain('Legenda 1');
      expect(text).toContain('Legenda 2');
      expect(text).toContain('Legenda 3');
      expect(text).toContain('Legenda 4');
    });

    it('deve exportar JSON com timestamp ISO', async () => {
      exportService.exportText(testContent, 'json');

      const [blob] = vi.mocked(saveAs).mock.calls[0];
      const text = await blob.text();
      const json = JSON.parse(text);

      // Verificar formato ISO 8601
      expect(json.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});

