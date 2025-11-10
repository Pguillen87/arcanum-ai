// src/components/brand/BrandVoiceLibrary.tsx
// Componente para listar e gerenciar vozes da marca

import { useState } from 'react';
import { useBrandVoice } from '@/hooks/useBrandVoice';
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Library, Eye, Trash2, Star, StarOff, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { RuneIcon } from '@/components/cosmic/RuneIcon';
import { BrandVoiceTrainer } from './BrandVoiceTrainer';
import { MigrationWarning } from './MigrationWarning';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function BrandVoiceLibrary() {
  const { 
    profiles, 
    isLoadingProfiles, 
    deleteProfile, 
    setDefaultProfile, 
    isDeletingProfile, 
    isSettingDefault,
    migrationRequired
  } = useBrandVoice();
  
  const [showTrainer, setShowTrainer] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | undefined>(undefined);
  const [viewingProfileId, setViewingProfileId] = useState<string | undefined>(undefined);

  const handleDelete = async (profileId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta voz? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteProfile(profileId);
      toast.success('Voz excluída com sucesso');
    } catch (error: any) {
      toast.error('Erro ao excluir voz', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleSetDefault = async (profileId: string) => {
    try {
      await setDefaultProfile(profileId);
      toast.success('Voz padrão atualizada');
    } catch (error: any) {
      toast.error('Erro ao definir voz padrão', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleEdit = (profileId: string) => {
    // Não permitir abrir dialog se migration é necessária
    if (migrationRequired === true) {
      toast.error('Aplique a migration primeiro para editar vozes', {
        description: 'Consulte o aviso acima para instruções.',
      });
      return;
    }
    setEditingProfileId(profileId);
    setShowTrainer(true);
  };

  const handleNewVoice = () => {
    // Não permitir abrir dialog se migration é necessária
    if (migrationRequired === true) {
      toast.error('Aplique a migration primeiro para criar uma nova voz', {
        description: 'Consulte o aviso acima para instruções.',
      });
      return;
    }
    setEditingProfileId(undefined);
    setShowTrainer(true);
  };

  const handleTrainerSuccess = (profileId: string) => {
    setShowTrainer(false);
    setEditingProfileId(undefined);
    toast.success('Voz treinada com sucesso!');
  };

  const handleTrainerCancel = () => {
    setShowTrainer(false);
    setEditingProfileId(undefined);
    // Garantir que o body não fique travado (limpeza extra de segurança)
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
    }
  };

  // Priorizar aviso de migration sobre loading
  // Se migration é necessária OU ainda verificando, mostrar aviso ou loading apropriado
  if (migrationRequired === true) {
    return (
      <CosmicCard title="Biblioteca de Vozes" description="Suas essências criativas salvas">
        <MigrationWarning />
      </CosmicCard>
    );
  }

  // Mostrar loading apenas se não houver necessidade de migration E verificação já completou
  if (migrationRequired === null || isLoadingProfiles) {
    return (
      <CosmicCard title="Biblioteca de Vozes" description="Suas essências criativas salvas">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">
            {migrationRequired === null ? 'Verificando configuração...' : 'Carregando vozes...'}
          </span>
        </div>
      </CosmicCard>
    );
  }

  return (
    <>
      <CosmicCard title="Biblioteca de Vozes" description="Suas essências criativas salvas">
        <div className="space-y-4">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RuneIcon icon={Library} size="sm" />
              <p className="text-sm text-muted-foreground">
                Gerencie múltiplas vozes de marca para diferentes projetos e contextos.
              </p>
            </div>
            <CosmicButton onClick={handleNewVoice} size="sm">
              <Wand2 className="w-4 h-4 mr-2" />
              Nova Voz
            </CosmicButton>
          </div>

          {profiles.length === 0 ? (
            <div className="py-8">
              <Alert>
                <AlertDescription className="text-center">
                  <div className="space-y-2">
                    <p className="font-medium">🌟 Você ainda não tem nenhuma voz treinada</p>
                    <p className="text-sm">Clique em "Nova Voz" para começar a despertar sua primeira essência criativa.</p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="grid gap-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 glass-cosmic rounded-lg border border-border/30 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{profile.name}</h4>
                        {profile.is_default && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                            Padrão
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {profile.model_provider === 'anthropic' ? 'Claude' : 'GPT-4o'}
                        </span>
                      </div>
                      {profile.description && (
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Criado em {format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!profile.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(profile.id)}
                          disabled={isSettingDefault}
                          title="Definir como padrão"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(profile.id)}
                        title="Editar"
                      >
                        <Wand2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(profile.id)}
                        disabled={isDeletingProfile}
                        title="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CosmicCard>

      {/* Dialog para treinar/editar voz */}
      <Dialog 
        open={showTrainer && migrationRequired !== true} 
        onOpenChange={(open) => {
          if (!open) {
            // Fechar dialog e limpar estado
            setShowTrainer(false);
            setEditingProfileId(undefined);
            // Garantir que o body não fique travado
            if (typeof document !== 'undefined') {
              setTimeout(() => {
                document.body.style.pointerEvents = '';
                document.body.removeAttribute('data-scroll-locked');
              }, 100);
            }
          } else if (migrationRequired === true) {
            // Não permitir abrir se migration necessária
            setShowTrainer(false);
            toast.error('Aplique a migration primeiro', {
              description: 'Consulte o aviso acima para instruções.',
            });
          } else {
            setShowTrainer(open);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfileId ? 'Editar Voz da Marca' : 'Treinar Nova Voz'}
            </DialogTitle>
            <DialogDescription>
              {editingProfileId
                ? 'Atualize os samples para refinar sua voz.'
                : 'Forneça exemplos de textos para que a IA aprenda seu estilo único.'}
            </DialogDescription>
          </DialogHeader>
          <BrandVoiceTrainer
            brandProfileId={editingProfileId}
            onSuccess={handleTrainerSuccess}
            onCancel={handleTrainerCancel}
            migrationRequired={migrationRequired}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

