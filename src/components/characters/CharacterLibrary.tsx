// src/components/characters/CharacterLibrary.tsx
// Biblioteca de personagens com visual tipo "portal"

import { useState } from 'react';
import { useCharacters } from '@/hooks/useCharacters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Sparkles, Star, Trash2, Edit2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { RuneBorder } from '@/components/ui/mystical';
import { cn } from '@/lib/utils';
import { CharacterCreator } from './CharacterCreator';
import { CharacterPreview } from './CharacterPreview';
import type { Character } from '@/schemas/character';

type FilterType = 'all' | 'mine' | 'templates';

export function CharacterLibrary() {
  const { characters, defaultCharacter, deleteCharacter, setDefaultCharacter, isLoadingCharacters } = useCharacters();
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingCharacter, setEditingCharacter] = useState<string | null>(null);
  const [creatingCharacter, setCreatingCharacter] = useState(false);

  const filteredCharacters = characters.filter(char => {
    if (filter === 'mine') return true; // Todos são do usuário devido ao RLS
    if (filter === 'templates') return char.metadata?.is_template === true;
    return true;
  });

  const handleDelete = async (characterId: string) => {
    if (!confirm('Tem certeza que deseja deletar este personagem?')) {
      return;
    }

    try {
      await deleteCharacter(characterId);
      toast.success('Personagem deletado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao deletar personagem', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleSetDefault = async (characterId: string) => {
    try {
      await setDefaultCharacter(characterId);
      toast.success('Personagem padrão atualizado!');
    } catch (error: any) {
      toast.error('Erro ao definir personagem padrão', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    }
  };

  if (isLoadingCharacters) {
    return (
      <CosmicCard title="Biblioteca de Personagens" description="Seus personagens mágicos">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-mystical-gold" />
        </div>
      </CosmicCard>
    );
  }

  return (
    <CosmicCard title="Biblioteca de Personagens" description="Seus personagens mágicos">
      <div className="space-y-6">
        {/* Filtros e Ações */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'mine' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('mine')}
            >
              Meus
            </Button>
            <Button
              variant={filter === 'templates' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('templates')}
            >
              Templates
            </Button>
          </div>

          <Dialog open={creatingCharacter} onOpenChange={setCreatingCharacter}>
            <DialogTrigger asChild>
              <Button className="bg-mystical-gold text-mystical-deep hover:bg-mystical-gold-light">
                <Plus className="w-4 h-4 mr-2" />
                Criar Personagem
              </Button>
            </DialogTrigger>
            <DialogContent
              overlayClassName="bg-gradient-to-br from-mystical-night/85 via-mystical-deep/80 to-mystical-night/90 backdrop-blur-sm"
              className="w-full max-w-[min(96vw,60rem)] translate-x-[-50%] translate-y-[-50%] gap-0 border-0 bg-transparent p-0 shadow-none sm:rounded-none"
            >
              <DialogDescription className="sr-only">
                Portal de criação de personagem com oito dimensões de personalidade e configurações avançadas.
              </DialogDescription>
              <div className="max-h-[min(92vh,820px)] overflow-y-auto px-2 sm:px-4 py-6">
                <CharacterCreator
                  onSuccess={() => {
                    setCreatingCharacter(false);
                    toast.success('Personagem criado com sucesso!');
                  }}
                  onCancel={() => setCreatingCharacter(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Grid de Personagens */}
        {filteredCharacters.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-mystical-gold opacity-50" />
            <p className="text-muted-foreground mb-4">
              {filter === 'templates' 
                ? 'Nenhum template disponível ainda.'
                : 'Você ainda não criou nenhum personagem.'}
            </p>
            <Dialog open={creatingCharacter} onOpenChange={setCreatingCharacter}>
              <DialogTrigger asChild>
                <Button className="bg-mystical-gold text-mystical-deep hover:bg-mystical-gold-light">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Personagem
                </Button>
              </DialogTrigger>
              <DialogContent
                overlayClassName="bg-gradient-to-br from-mystical-night/85 via-mystical-deep/80 to-mystical-night/90 backdrop-blur-sm"
                className="w-full max-w-[min(96vw,60rem)] translate-x-[-50%] translate-y-[-50%] gap-0 border-0 bg-transparent p-0 shadow-none sm:rounded-none"
              >
                <DialogDescription className="sr-only">
                  Portal de criação de personagem com oito dimensões de personalidade e configurações avançadas.
                </DialogDescription>
                <div className="max-h-[min(92vh,820px)] overflow-y-auto px-2 sm:px-4 py-6">
                  <CharacterCreator
                    onSuccess={() => {
                      setCreatingCharacter(false);
                      toast.success('Personagem criado com sucesso!');
                    }}
                    onCancel={() => setCreatingCharacter(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map((character) => (
              <RuneBorder
                key={character.id}
                variant={character.is_default ? 'gold' : 'lilac'}
                glow={false}
                animated={false}
                borderStyle="solid"
                showCorners={false}
                className={cn(
                  'cursor-pointer transition-colors border-border/60 bg-background/80 hover:border-primary/50',
                  character.is_default && 'border-primary/60'
                )}
              >
                <Card className="border-0 bg-transparent">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate flex items-center gap-2">
                          {character.name}
                          {character.is_default && (
                            <Badge variant="outline" className="border-mystical-gold text-mystical-gold">
                              <Star className="w-3 h-3 mr-1 fill-mystical-gold" />
                              Padrão
                            </Badge>
                          )}
                        </CardTitle>
                        {character.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {character.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Avatar ou ícone */}
                    {character.avatar_url ? (
                      <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-mystical-gold/50">
                        <img
                          src={character.avatar_url}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-mystical-gold via-mystical-lilac to-mystical-cosmic flex items-center justify-center">
                        <Wand2 className="w-8 h-8 text-white" />
                      </div>
                    )}

                    {/* Informações rápidas */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Modelo:</span>
                        <span className="font-medium">{character.model_provider === 'anthropic' ? 'Claude' : 'GPT-4o'}</span>
                      </div>
                      {character.personality_core && (
                        <div className="flex items-center justify-between">
                          <span>Humanidade:</span>
                          <span className="font-medium">
                            {(character.personality_core as any).robotic_human}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2 border-t border-mystical-gold/20">
                      <Dialog open={editingCharacter === character.id} onOpenChange={(open) => setEditingCharacter(open ? character.id : null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setEditingCharacter(character.id!)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent
                          overlayClassName="bg-gradient-to-br from-mystical-night/85 via-mystical-deep/80 to-mystical-night/90 backdrop-blur-sm"
                          className="w-full max-w-[min(96vw,60rem)] translate-x-[-50%] translate-y-[-50%] gap-0 border-0 bg-transparent p-0 shadow-none sm:rounded-none"
                        >
                          <DialogDescription className="sr-only">
                            Portal para editar um personagem existente e ajustar suas dimensões.
                          </DialogDescription>
                          <div className="max-h-[min(92vh,820px)] overflow-y-auto px-2 sm:px-4 py-6">
                            <CharacterCreator
                              characterId={character.id}
                              onSuccess={() => {
                                setEditingCharacter(null);
                                toast.success('Personagem atualizado com sucesso!');
                              }}
                              onCancel={() => setEditingCharacter(null)}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>

                      {!character.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => character.id && handleSetDefault(character.id)}
                          title="Definir como padrão"
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => character.id && handleDelete(character.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </RuneBorder>
            ))}
          </div>
        )}
      </div>
    </CosmicCard>
  );
}

