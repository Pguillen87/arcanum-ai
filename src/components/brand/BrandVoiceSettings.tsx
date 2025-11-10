import { useState } from 'react';
import { useBrandVoice, type BrandVoice } from '@/hooks/useBrandVoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function BrandVoiceSettings() {
  const { brandVoice, isLoading, updateBrandVoice, deleteBrandVoice, isUpdating, isDeleting } = useBrandVoice();
  const [formData, setFormData] = useState<BrandVoice>({
    tone: '',
    style: '',
    examples: [],
    preferences: {
      length: 'medium',
      formality: 'neutral',
      creativity: 'medium',
    },
  });
  const [exampleText, setExampleText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Inicializar formData quando brandVoice carregar
  useState(() => {
    if (brandVoice) {
      setFormData({
        tone: brandVoice.tone || '',
        style: brandVoice.style || '',
        examples: brandVoice.examples || [],
        preferences: brandVoice.preferences || {
          length: 'medium',
          formality: 'neutral',
          creativity: 'medium',
        },
      });
    }
  });

  const handleAddExample = () => {
    if (exampleText.trim()) {
      setFormData({
        ...formData,
        examples: [...(formData.examples || []), exampleText.trim()],
      });
      setExampleText('');
    }
  };

  const handleRemoveExample = (index: number) => {
    setFormData({
      ...formData,
      examples: formData.examples?.filter((_, i) => i !== index) || [],
    });
  };

  const handleSave = async () => {
    setError(null);
    try {
      await updateBrandVoice(formData);
      toast.success('Voz da Marca salva com sucesso!', {
        description: 'Suas preferências serão aplicadas nas próximas transformações.',
      });
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar Voz da Marca');
      toast.error('Erro ao salvar Voz da Marca', {
        description: err?.message || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover sua Voz da Marca? Isso não afetará transformações já criadas.')) {
      return;
    }

    setError(null);
    try {
      await deleteBrandVoice();
      setFormData({
        tone: '',
        style: '',
        examples: [],
        preferences: {
          length: 'medium',
          formality: 'neutral',
          creativity: 'medium',
        },
      });
      toast.success('Voz da Marca removida');
    } catch (err: any) {
      setError(err?.message || 'Erro ao remover Voz da Marca');
      toast.error('Erro ao remover Voz da Marca');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Voz da Marca</CardTitle>
        </div>
        <CardDescription>
          Configure o estilo e tom que deseja aplicar em suas transformações de conteúdo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="tone">Tom</Label>
          <Input
            id="tone"
            placeholder="Ex: profissional, descontraído, místico, poético"
            value={formData.tone || ''}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Descreva o tom geral que deseja para seus conteúdos
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="style">Estilo</Label>
          <Input
            id="style"
            placeholder="Ex: formal, casual, poético, técnico"
            value={formData.style || ''}
            onChange={(e) => setFormData({ ...formData, style: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Descreva o estilo de escrita desejado
          </p>
        </div>

        <div className="space-y-2">
          <Label>Preferências</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length" className="text-sm">Tamanho</Label>
              <Select
                value={formData.preferences?.length || 'medium'}
                onValueChange={(value: 'short' | 'medium' | 'long') =>
                  setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, length: value },
                  })
                }
              >
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Curto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="long">Longo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formality" className="text-sm">Formalidade</Label>
              <Select
                value={formData.preferences?.formality || 'neutral'}
                onValueChange={(value: 'formal' | 'neutral' | 'casual') =>
                  setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, formality: value },
                  })
                }
              >
                <SelectTrigger id="formality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creativity" className="text-sm">Criatividade</Label>
              <Select
                value={formData.preferences?.creativity || 'medium'}
                onValueChange={(value: 'low' | 'medium' | 'high') =>
                  setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, creativity: value },
                  })
                }
              >
                <SelectTrigger id="creativity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Exemplos de Texto</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Adicione exemplos de textos no estilo desejado para ajudar a IA a entender melhor sua voz
          </p>
          <div className="flex gap-2">
            <Textarea
              placeholder="Cole aqui um exemplo de texto no estilo desejado..."
              value={exampleText}
              onChange={(e) => setExampleText(e.target.value)}
              rows={3}
            />
            <Button type="button" onClick={handleAddExample} variant="outline" size="icon">
              +
            </Button>
          </div>
          {formData.examples && formData.examples.length > 0 && (
            <div className="space-y-2 mt-2">
              {formData.examples.map((example, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded-md">
                  <p className="flex-1 text-sm">{example}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveExample(index)}
                    className="h-6 w-6"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={isUpdating || isDeleting} className="flex-1">
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Voz da Marca
              </>
            )}
          </Button>
          {brandVoice && (
            <Button
              onClick={handleDelete}
              disabled={isUpdating || isDeleting}
              variant="destructive"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

