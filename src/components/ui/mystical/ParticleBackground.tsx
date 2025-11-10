// src/components/ui/mystical/ParticleBackground.tsx
// Componente de fundo com partículas flutuantes místicas

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ParticleBackgroundProps {
  particleCount?: number;
  color?: 'gold' | 'lilac' | 'cosmic' | 'mixed';
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

const colorMap = {
  gold: 'rgba(255, 215, 0, 0.6)',
  lilac: 'rgba(157, 78, 221, 0.6)',
  cosmic: 'rgba(74, 144, 226, 0.6)',
  mixed: ['rgba(255, 215, 0, 0.4)', 'rgba(157, 78, 221, 0.4)', 'rgba(74, 144, 226, 0.4)'],
};

const intensityMap = {
  low: 20,
  medium: 50,
  high: 100,
};

export function ParticleBackground({
  particleCount = 50,
  color = 'mixed',
  className,
  intensity = 'medium',
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar tamanho do canvas
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Criar partículas
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      opacity: number;
    }> = [];

    const colors = color === 'mixed' 
      ? colorMap.mixed as string[]
      : [colorMap[color]];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.3,
      });
    }

    // Animar partículas
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace('0.6', particle.opacity.toString());
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [particleCount, color, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{ opacity: intensityMap[intensity] / 100 }}
    />
  );
}

