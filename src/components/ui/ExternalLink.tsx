import React from 'react';
import { cn } from '@/lib/utils';
import { Observability } from '@/lib/observability';
import { useToast } from '@/hooks/use-toast';

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  critical?: boolean; // mostra aviso sutil ao navegar para portal externo
}

function isSafeExternalUrl(url: string) {
  try {
    const u = new URL(url, window.location.origin);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export const ExternalLink: React.FC<ExternalLinkProps> = ({ href, children, className, critical = false, ...rest }) => {
  const { toast } = useToast();
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isSafeExternalUrl(href)) {
      e.preventDefault();
      toast({ title: 'Link inválido', description: 'URL externa não permitida.', variant: 'destructive' });
      Observability.trackEvent('external_link_blocked', { href });
      return;
    }
    if (critical) {
      toast({ title: 'Portal externo', description: 'Você está indo para um portal externo.', });
      Observability.trackEvent('external_link_navigate', { href });
    }
    rest.onClick?.(e);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('underline underline-offset-4 hover:opacity-90', className)}
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  );
};

