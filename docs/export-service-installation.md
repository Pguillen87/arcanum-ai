# Instruções de Instalação - Serviço de Exportação

O serviço de exportação (`exportService.ts`) suporta múltiplos formatos com fallbacks automáticos.

## Dependências Obrigatórias

```bash
npm install file-saver
npm install --save-dev @types/file-saver
```

## Dependências Opcionais (para formatos avançados)

### Para exportação DOCX:
```bash
npm install docx
```

### Para exportação PDF (escolha uma opção):

**Opção 1 - jsPDF (recomendado, mais leve):**
```bash
npm install jspdf
npm install --save-dev @types/jspdf
```

**Opção 2 - pdfmake (mais recursos, maior):**
```bash
npm install pdfmake
```

## Comportamento

- **TXT, MD, JSON**: Funcionam sempre (sem dependências extras)
- **SRT**: Funciona sempre (implementação nativa)
- **DOCX**: Requer `docx`. Se não instalado, exporta como TXT automaticamente
- **PDF**: Requer `jspdf` ou `pdfmake`. Se não instalado, exporta como TXT automaticamente

## Uso

```typescript
import { exportService } from '@/services/exportService';

// Exportar transcrição
await exportService.exportTranscription(text, 'pdf', { filename: 'transcricao.pdf' });

// Exportar transformação
exportService.exportTransformation(text, 'json', { filename: 'transformacao.json' });
```

## Componente UI

Use o componente `ExportButton` em seus componentes:

```tsx
import { ExportButton } from '@/components/export/ExportButton';

<ExportButton
  content={transcriptionText}
  type="transcription"
  defaultFilename="minha-transcricao"
  formats={['txt', 'md', 'docx', 'pdf', 'srt']}
/>
```

