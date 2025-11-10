import React from 'react';
import { Button } from '@/components/ui/button';

export const HighContrastToggle: React.FC = () => {
  const enable = () => {
    document.documentElement.classList.add('alto-contraste');
    try { localStorage.setItem('high_contrast', 'true'); } catch {}
  };
  const disable = () => {
    document.documentElement.classList.remove('alto-contraste');
    try { localStorage.setItem('high_contrast', 'false'); } catch {}
  };
  const isEnabled = document.documentElement.classList.contains('alto-contraste');
  const toggle = () => (isEnabled ? disable() : enable());

  return (
    <Button variant="outline" size="sm" onClick={toggle} aria-label="Alternar alto contraste">
      {isEnabled ? 'Alto Contraste: ON' : 'Alto Contraste: OFF'}
    </Button>
  );
};

