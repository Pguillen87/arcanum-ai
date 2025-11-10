// src/components/transcription/TranscriptionHistory.tsx
// Componente completo para histórico de transcrições com filtros e busca

import { useState, useMemo } from 'react';
import { useTranscription } from '@/hooks/useTranscription';
import { useCharacters } from '@/hooks/useCharacters';
import { useProjects } from '@/hooks/useProjects';
import { TranscriptionResult } from './TranscriptionResult';
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Filter, History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { RuneBorder } from '@/components/ui/mystical';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TranscriptionHistory } from '@/schemas/transcription';

export function TranscriptionHistory() {
  const { history, isLoadingHistory, errorHistory } = useTranscription();
  const { characters } = useCharacters();
  const { projects } = useProjects();

  const [searchText, setSearchText] = useState('');
  const [filterSourceType, setFilterSourceType] = useState<'all' | 'text' | 'audio' | 'video'>('all');
  const [filterCharacterId, setFilterCharacterId] = useState<string>('all');
  const [filterProjectId, setFilterProjectId] = useState<string>('all');

  // Filtrar histórico
  const filteredHistory = useMemo(() => {
    if (!history) return [];

    return history.filter((item) => {
      // Busca por texto
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          item.original_text.toLowerCase().includes(searchLower) ||
          (item.transformed_text?.toLowerCase().includes(searchLower) ?? false);
        if (!matchesSearch) return false;
      }

      // Filtro por tipo de fonte
      if (filterSourceType !== 'all' && item.source_type !== filterSourceType) {
        return false;
      }

      // Filtro por personagem
      if (filterCharacterId !== 'all') {
        if (filterCharacterId === 'none' && item.character_id) return false;
        if (filterCharacterId !== 'none' && item.character_id !== filterCharacterId) return false;
      }

      // Filtro por projeto
      if (filterProjectId !== 'all' && item.project_id !== filterProjectId) {
        return false;
      }

      return true;
    });
  }, [history, searchText, filterSourceType, filterCharacterId, filterProjectId]);

  if (isLoadingHistory) {
    return (
      <CosmicCard title="Histórico de Transcrições" description="Suas transcrições e transformações">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Carregando histórico...</span>
        </div>
      </CosmicCard>
    );
  }

  if (errorHistory) {
    return (
      <CosmicCard title="Histórico de Transcrições" description="Suas transcrições e transformações">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar histórico: {errorHistory.message || 'Erro desconhecido'}
          </AlertDescription>
        </Alert>
      </CosmicCard>
    );
  }

  return (
    <CosmicCard title="Histórico de Transcrições" description="Suas transcrições e transformações">
      <div className="space-y-6">
        {/* Filtros */}
        <RuneBorder variant="cosmic">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-mystical-cosmic" />
              <h3 className="font-semibold text-lg">Filtros</h3>
            </div>

            {/* Busca */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar no texto original ou transformado..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros em grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tipo de fonte */}
              <div className="space-y-2">
                <Label htmlFor="source-type">Tipo de Fonte</Label>
                <Select value={filterSourceType} onValueChange={(val: any) => setFilterSourceType(val)}>
                  <SelectTrigger id="source-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Personagem */}
              <div className="space-y-2">
                <Label htmlFor="character-filter">Personagem</Label>
                <Select value={filterCharacterId} onValueChange={setFilterCharacterId}>
                  <SelectTrigger id="character-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="none">Sem personagem</SelectItem>
                    {characters.map((char) => (
                      <SelectItem key={char.id} value={char.id!}>
                        {char.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Projeto */}
              <div className="space-y-2">
                <Label htmlFor="project-filter">Projeto</Label>
                <Select value={filterProjectId} onValueChange={setFilterProjectId}>
                  <SelectTrigger id="project-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Limpar filtros */}
            {(searchText || filterSourceType !== 'all' || filterCharacterId !== 'all' || filterProjectId !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchText('');
                  setFilterSourceType('all');
                  setFilterCharacterId('all');
                  setFilterProjectId('all');
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </RuneBorder>

        {/* Lista de resultados */}
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center">
            <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">
              {history && history.length === 0
                ? 'Nenhuma transcrição ainda. Comece transcrevendo um áudio ou vídeo!'
                : 'Nenhuma transcrição encontrada com os filtros aplicados.'}
            </p>
            {(searchText || filterSourceType !== 'all' || filterCharacterId !== 'all' || filterProjectId !== 'all') && (
              <Button variant="outline" size="sm" onClick={() => {
                setSearchText('');
                setFilterSourceType('all');
                setFilterCharacterId('all');
                setFilterProjectId('all');
              }}>
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredHistory.length} de {history?.length || 0} transcrições
            </div>
            {filteredHistory.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 glass-cosmic">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {item.source_type === 'audio' ? '🎵 Áudio' : item.source_type === 'video' ? '🎬 Vídeo' : '📝 Texto'}
                      </span>
                      {item.character_id && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-mystical-gold/20 text-mystical-gold">
                          {characters.find(c => c.id === item.character_id)?.name || 'Personagem'}
                        </span>
                      )}
                      {item.transformation_type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-mystical-lilac/20 text-mystical-lilac">
                          {item.transformation_type}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <TranscriptionResult history={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </CosmicCard>
  );
}

