import { useState, useEffect } from "react";
import { PortalContainer } from "@/components/portals/PortalContainer";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Shield, AlertTriangle, Settings, CheckCircle } from "lucide-react";
import { RuneIcon } from "@/components/cosmic/RuneIcon";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProtectionSettings } from "@/types/auth";

interface ProtecaoPortalProps {
  onClose: () => void;
}

export const ProtecaoPortal = ({ onClose }: ProtecaoPortalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [autoModeration, setAutoModeration] = useState(true);
  const [offensiveFilter, setOffensiveFilter] = useState(true);
  const [brandVerification, setBrandVerification] = useState(true);

  // Load user's protection settings
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('protection_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setAutoModeration(data.auto_moderation);
        setOffensiveFilter(data.offensive_filter);
        setBrandVerification(data.brand_verification);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (field: keyof ProtectionSettings, value: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('protection_settings')
        .update({ [field]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Configuração atualizada',
        description: 'Suas preferências foram salvas com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAutoModerationChange = (checked: boolean) => {
    setAutoModeration(checked);
    updateSetting('auto_moderation', checked);
  };

  const handleOffensiveFilterChange = (checked: boolean) => {
    setOffensiveFilter(checked);
    updateSetting('offensive_filter', checked);
  };

  const handleBrandVerificationChange = (checked: boolean) => {
    setBrandVerification(checked);
    updateSetting('brand_verification', checked);
  };

  return (
    <PortalContainer title="Proteção - Escudo Dimensional" onClose={onClose}>
      <div className="grid gap-6 md:gap-8">
        {/* Moderation Dashboard */}
        <CosmicCard
          title="Dashboard de Moderação"
          description="Mantenha a integridade da sua marca"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 glass-cosmic rounded-lg text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">142</p>
                <p className="text-xs text-muted-foreground">Conteúdos Aprovados</p>
              </div>
              <div className="p-4 glass-cosmic rounded-lg text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Aguardando Revisão</p>
              </div>
              <div className="p-4 glass-cosmic rounded-lg text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-muted-foreground">Taxa de Proteção</p>
              </div>
            </div>
          </div>
        </CosmicCard>

        {/* Content Filters */}
        <CosmicCard
          title="Filtros de Conteúdo"
          description="Configure suas proteções dimensionais"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RuneIcon icon={Settings} size="sm" />
              <p className="text-sm text-muted-foreground">
                Ative ou desative proteções de acordo com suas necessidades
              </p>
            </div>

            <div className="space-y-3">
              {/* Moderação Automática */}
              <div className="p-4 glass-cosmic rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <Label htmlFor="auto-moderation" className="font-semibold text-sm cursor-pointer">
                      Moderação Automática
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      IA analisa conteúdo antes da publicação
                    </p>
                  </div>
                  <Switch
                    id="auto-moderation"
                    checked={autoModeration}
                    onCheckedChange={handleAutoModerationChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Filtro de Linguagem Ofensiva */}
              <div className="p-4 glass-cosmic rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <Label htmlFor="offensive-filter" className="font-semibold text-sm cursor-pointer">
                      Filtro de Linguagem Ofensiva
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bloqueia palavras e frases inapropriadas
                    </p>
                  </div>
                  <Switch
                    id="offensive-filter"
                    checked={offensiveFilter}
                    onCheckedChange={handleOffensiveFilterChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Verificação de Marca */}
              <div className="p-4 glass-cosmic rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <Label htmlFor="brand-verification" className="font-semibold text-sm cursor-pointer">
                      Verificação de Marca
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Garante alinhamento com diretrizes da marca
                    </p>
                  </div>
                  <Switch
                    id="brand-verification"
                    checked={brandVerification}
                    onCheckedChange={handleBrandVerificationChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <CosmicButton variant="outline" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Configurações Avançadas
            </CosmicButton>
          </div>
        </CosmicCard>

        {/* Recent Moderation Logs */}
        <CosmicCard
          title="Logs Recentes"
          description="Últimas atividades de moderação"
        >
          <div className="space-y-3">
            <div className="p-3 glass-cosmic rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Conteúdo aprovado</p>
                <p className="text-xs text-muted-foreground truncate">
                  Post sobre tecnologia revisado e aprovado
                </p>
                <p className="text-xs text-muted-foreground mt-1">Há 2 horas</p>
              </div>
            </div>

            <div className="p-3 glass-cosmic rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Aguardando revisão</p>
                <p className="text-xs text-muted-foreground truncate">
                  Conteúdo flagged para revisão manual
                </p>
                <p className="text-xs text-muted-foreground mt-1">Há 5 horas</p>
              </div>
            </div>
          </div>
        </CosmicCard>
      </div>
    </PortalContainer>
  );
};
