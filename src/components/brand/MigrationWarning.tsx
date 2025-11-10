// Componente de aviso sobre migration pendente do Brand Voice
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BookOpen, Code2, Sparkles, RefreshCw } from 'lucide-react';
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { Button } from '@/components/ui/button';
import { clearSchemaCache } from '@/utils/checkBrandVoiceSchema';
import { useQueryClient } from '@tanstack/react-query';

interface MigrationWarningProps {
  className?: string;
}

export function MigrationWarning({ className }: MigrationWarningProps) {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // Limpar cache e forçar nova verificação
    clearSchemaCache();
    // Invalidar queries relacionadas
    queryClient.invalidateQueries({ queryKey: ['brandProfiles'] });
    queryClient.invalidateQueries({ queryKey: ['brandProfile'] });
    // Recarregar página para forçar nova verificação
    window.location.reload();
  };

  return (
    <CosmicCard className={className}>
      <Alert className="border-violet-500/50 bg-violet-950/20">
        <AlertTriangle className="h-5 w-5 text-violet-400" />
        <AlertTitle className="text-lg font-semibold text-violet-300 mb-2">
          Ritual de Inicialização Pendente
        </AlertTitle>
        <AlertDescription className="space-y-3 text-violet-200/90">
          <p>
            As tábuas da essência criativa ainda não foram consagradas no banco de dados místico.
            Para desbloquear o poder da Voz da Marca, é necessário aplicar a migration primeiro.
          </p>
          
          <div className="space-y-2 mt-4">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-violet-300 mb-1">Via Supabase Dashboard (Recomendado):</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-violet-200/80 ml-2">
                  <li>Acesse o <a href="https://app.supabase.com/project/giozhrukzcqoopssegby" target="_blank" rel="noopener noreferrer" className="underline text-violet-300 hover:text-violet-200">SQL Editor no Supabase Dashboard</a></li>
                  <li>Execute o conteúdo do arquivo <code className="bg-violet-900/50 px-1 rounded">supabase/migrations/20250115000001_create_brand_voice_tables.sql</code></li>
                  <li>Aguarde a conclusão da migration</li>
                  <li>Clique no botão "Atualizar" abaixo para verificar novamente</li>
                </ol>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Code2 className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-violet-300 mb-1">Via Supabase CLI:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-violet-200/80 ml-2">
                  <li>Execute: <code className="bg-violet-900/50 px-1 rounded">npm run migrate:brand-voice</code></li>
                  <li>Ou: <code className="bg-violet-900/50 px-1 rounded">supabase db push</code></li>
                </ol>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-violet-800/50">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="w-full border-violet-500/50 text-violet-300 hover:bg-violet-900/30 hover:text-violet-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar e Verificar Novamente
            </Button>
            <p className="text-xs text-violet-300/70 mt-2 text-center">
              Clique após aplicar a migration para verificar se foi aplicada com sucesso
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </CosmicCard>
  );
}

