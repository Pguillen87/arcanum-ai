import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { TransformationLength, TransformationType } from "@/hooks/useTransformText";

export interface TransformationSettingsProps {
  selectedType: TransformationType;
  onChangeType: (type: TransformationType) => void;
  transformationLength: TransformationLength;
  onChangeLength: (length: TransformationLength) => void;
  tone?: string;
  onChangeTone?: (tone: string | undefined) => void;
  isTransforming?: boolean;
}

export function TransformationSettings({
  selectedType,
  onChangeType,
  transformationLength,
  onChangeLength,
  tone,
  onChangeTone,
  isTransforming,
}: TransformationSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transform-type">Tipo de Transformação</Label>
          <Select value={selectedType} onValueChange={(value) => onChangeType(value as TransformationType)} disabled={isTransforming}>
            <SelectTrigger id="transform-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="post">Post para Redes Sociais</SelectItem>
              <SelectItem value="resumo">Resumo</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="roteiro">Roteiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transform-length">Tamanho</Label>
          <Select
            value={transformationLength}
            onValueChange={(value) => onChangeLength(value as TransformationLength)}
            disabled={isTransforming}
          >
            <SelectTrigger id="transform-length">
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

      {typeof tone === "string" && tone.length > 0 && onChangeTone && (
        <div className="space-y-2">
          <Label htmlFor="transform-tone">Tom (opcional)</Label>
          <Select
            value={tone || undefined}
            onValueChange={(value) => onChangeTone(value === "__default__" ? undefined : value)}
            disabled={isTransforming}
          >
            <SelectTrigger id="transform-tone">
              <SelectValue placeholder="Selecione um tom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Padrão</SelectItem>
              <SelectItem value="profissional">Profissional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="criativo">Criativo</SelectItem>
              <SelectItem value="inspirador">Inspirador</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
