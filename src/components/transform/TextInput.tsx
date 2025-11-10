// Componente de entrada de texto para transformações
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
}

export const TextInput = ({
  value,
  onChange,
  placeholder = "Digite ou cole seu texto aqui...",
  className,
  disabled,
  minLength = 10,
  maxLength = 50000,
}: TextInputProps) => {
  const charCount = value.length;
  const isValid = charCount >= minLength && charCount <= maxLength;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="text-input">Texto de Entrada</Label>
      <Textarea
        id="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "min-h-[200px] resize-y",
          !isValid && charCount > 0 && "border-destructive focus-visible:ring-destructive"
        )}
        aria-invalid={!isValid && charCount > 0}
        aria-describedby="text-input-help"
      />
      <div className="flex justify-between items-center text-xs text-muted-foreground" id="text-input-help">
        <span>
          {charCount < minLength
            ? `Mínimo ${minLength} caracteres (${charCount}/${minLength})`
            : isValid
            ? `${charCount} caracteres`
            : `Máximo ${maxLength} caracteres excedido`}
        </span>
        <span className={cn(!isValid && "text-destructive")}>
          {maxLength - charCount} restantes
        </span>
      </div>
    </div>
  );
};

