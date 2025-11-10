// Componente de progresso de upload
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  progress: number;
  className?: string;
}

export const UploadProgress = ({ progress, className }: UploadProgressProps) => {
  return (
    <div className={cn("w-full space-y-2", className)}>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Enviando...</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

