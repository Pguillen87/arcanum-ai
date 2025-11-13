// src/components/transcription/VideoTranscribeTab.tsx
// Componente para upload e transcrição de vídeo com integração de characters

import { useState, useRef } from 'react';
import { useTranscription } from '@/hooks/useTranscription';
import { useCharacters } from '@/hooks/useCharacters';
import { useAssets } from '@/hooks/useAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, FileVideo, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { RuneBorder } from '@/components/ui/mystical';
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { Checkbox } from '@/components/ui/checkbox';
import type { TranscribeRequest } from '@/schemas/transcription';

interface VideoTranscribeTabProps {
  projectId?: string;
}

export function VideoTranscribeTab({ projectId }: VideoTranscribeTabProps) {
  const { transcribeAudio, isTranscribing } = useTranscription();
  const { characters, defaultCharacter } = useCharacters();
  const { uploadFile, isUploading } = useAssets(projectId || null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('pt');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(
    defaultCharacter?.id
  );
  const [applyTransformation, setApplyTransformation] = useState(false);
  const [transformationType, setTransformationType] = useState<'post' | 'resumo' | 'newsletter' | 'roteiro'>('post');
  const [transformationLength, setTransformationLength] = useState<'short' | 'medium' | 'long'>('medium');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato de arquivo não suportado', {
        description: 'Use arquivos de vídeo (MP4, WebM, MOV, AVI)',
      });
      return;
    }

    // Validar tamanho (máximo 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'O arquivo deve ter no máximo 100MB',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleTranscribe = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo de vídeo');
      return;
    }

    try {
      // 1. Upload do arquivo
      toast.info('Fazendo upload do arquivo...', { id: 'upload' });
      
      const uploadedAsset = await uploadFile({
        file: selectedFile,
        projectId: projectId,
        type: 'video',
      });

      toast.success('Upload concluído! Iniciando transcrição...', { id: 'upload' });

      // 2. Transcrever (Whisper também funciona com vídeo)
      const params: TranscribeRequest = {
        assetId: uploadedAsset.id,
        language,
        characterId: applyTransformation ? selectedCharacterId : undefined,
        applyTransformation,
        transformationType: applyTransformation ? transformationType : undefined,
        transformationLength: applyTransformation ? transformationLength : undefined,
      };

      const transcriptionResult = await transcribeAudio(params);

      toast.success('Transcrição concluída!', {
        description: applyTransformation && transcriptionResult.text
          ? 'Texto transformado com sucesso'
          : 'Vídeo transcrito com sucesso',
      });

      // Limpar formulário
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast.error('Erro ao processar', {
        description: error.message || 'Tente novamente',
      });
    }
  };

  return (
    <CosmicCard title="Transcrever Vídeo" description="Extraia áudio de vídeo e transforme com personagens">
      <div className="space-y-6">
        {/* Upload de arquivo */}
        <RuneBorder variant="cosmic">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-file">Arquivo de Vídeo</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  disabled={isUploading || isTranscribing}
                  className="flex-1"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileVideo className="w-4 h-4" />
                    <span>{selectedFile.name}</span>
                    <span className="text-xs">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select value={language} onValueChange={setLanguage} disabled={isTranscribing}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="en">Inglês</SelectItem>
                  <SelectItem value="es">Espanhol</SelectItem>
                  <SelectItem value="fr">Francês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </RuneBorder>

        {/* Opções de transformação */}
        <RuneBorder variant="gold">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="apply-transformation-video"
                checked={applyTransformation}
                onCheckedChange={(checked) => setApplyTransformation(checked === true)}
                disabled={isTranscribing || characters.length === 0}
              />
              <Label htmlFor="apply-transformation-video" className="cursor-pointer">
                Aplicar personagem após transcrição
              </Label>
            </div>

            {applyTransformation && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="character-video">Personagem</Label>
                  <Select
                    value={selectedCharacterId}
                    onValueChange={setSelectedCharacterId}
                    disabled={isTranscribing}
                  >
                    <SelectTrigger id="character-video">
                      <SelectValue placeholder="Selecione um personagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((char) => (
                        <SelectItem key={char.id} value={char.id!}>
                          {char.name}
                          {char.is_default && ' (Padrão)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transformation-type-video">Tipo de Transformação</Label>
                    <Select
                      value={transformationType}
                      onValueChange={(value: 'post' | 'resumo' | 'newsletter' | 'roteiro') =>
                        setTransformationType(value)
                      }
                      disabled={isTranscribing}
                    >
                      <SelectTrigger id="transformation-type-video">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post">Post</SelectItem>
                        <SelectItem value="resumo">Resumo</SelectItem>
                        <SelectItem value="newsletter">Newsletter</SelectItem>
                        <SelectItem value="roteiro">Roteiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transformation-length-video">Tamanho</Label>
                    <Select
                      value={transformationLength}
                      onValueChange={(value: 'short' | 'medium' | 'long') =>
                        setTransformationLength(value)
                      }
                      disabled={isTranscribing}
                    >
                      <SelectTrigger id="transformation-length-video">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Curto</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="long">Longo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </RuneBorder>

        {/* Botão de ação */}
        <Button
          onClick={handleTranscribe}
          disabled={!selectedFile || isUploading || isTranscribing}
          className="w-full bg-mystical-gold text-mystical-deep hover:bg-mystical-gold-light"
        >
          {isUploading || isTranscribing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isUploading ? 'Fazendo upload...' : 'Transcrevendo...'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Transcrever Vídeo
            </>
          )}
        </Button>

        {/* Informações */}
        {characters.length === 0 && (
          <Alert>
            <Sparkles className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Crie um personagem na Esfera Essência para aplicar transformações automáticas após a transcrição.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </CosmicCard>
  );
}

