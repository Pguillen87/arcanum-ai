// Componente de upload de arquivos com drag-and-drop
import { useCallback, useState, useRef } from 'react';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { Upload, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadProgress } from './UploadProgress';
import { AUDIO_MIME_TYPES, VIDEO_MIME_TYPES } from '@/constants/mediaFormats';

export type AssetType = 'text' | 'audio' | 'video';

interface FileUploadProps {
  projectId: string;
  type: AssetType;
  onUploadComplete?: (assetId: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

// Validações de arquivo
const FILE_LIMITS: Record<AssetType, { maxSize: number; mimeTypes: string[] }> = {
  text: {
    maxSize: 2 * 1024 * 1024, // 2MB
    mimeTypes: ['text/plain', 'text/markdown', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  audio: {
    maxSize: 200 * 1024 * 1024, // 200MB
    mimeTypes: [...AUDIO_MIME_TYPES],
  },
  video: {
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    mimeTypes: [...VIDEO_MIME_TYPES],
  },
};

export const FileUpload = ({
  projectId,
  type,
  onUploadComplete,
  onUploadError,
  className,
  disabled,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const limits = FILE_LIMITS[type];

    if (!limits.mimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Formato não suportado. Formatos aceitos: ${limits.mimeTypes.join(', ')}`,
      };
    }

    if (file.size > limits.maxSize) {
      const maxSizeMB = limits.maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setSelectedFile(file);

    try {
      // Importar assetsService dinamicamente para evitar dependência circular
      const { assetsService } = await import('@/services/assetsService');

      // Upload direto usando método uploadFile
      const { data: asset, error: uploadError } = await assetsService.uploadFile({
        projectId,
        type,
        file,
        onProgress: (percent) => {
          setProgress(percent);
        },
      });

      if (uploadError || !asset) {
        throw new Error(uploadError?.message || 'Erro ao fazer upload do arquivo');
      }

      setProgress(100);
      onUploadComplete?.(asset.id);

      // Reset após 2 segundos
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setSelectedFile(null);
      }, 2000);
    } catch (error: any) {
      setUploading(false);
      setProgress(0);
      onUploadError?.(error);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);

    if (!validation.valid) {
      onUploadError?.(new Error(validation.error || 'Arquivo inválido'));
      return;
    }

    handleUpload(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled || uploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, uploading]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative p-8 glass-cosmic rounded-lg border-2 border-dashed transition-colors cursor-pointer",
          isDragActive && "border-primary bg-primary/5",
          (disabled || uploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileInputChange}
          accept={FILE_LIMITS[type].mimeTypes.join(',')}
          disabled={disabled || uploading}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {uploading ? (
            <>
              <UploadProgress progress={progress} />
              <p className="text-sm text-muted-foreground">
                Enviando {selectedFile?.name}... {Math.round(progress)}%
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: {FILE_LIMITS[type].mimeTypes.join(', ')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tamanho máximo: {FILE_LIMITS[type].maxSize / (1024 * 1024)}MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedFile && !uploading && (
        <div className="flex items-center gap-2 p-3 glass-cosmic rounded-lg">
          <File className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remover arquivo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

