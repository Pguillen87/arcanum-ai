import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export const PerfOverlay: React.FC = () => {
  const [fps, setFps] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(true);
  const last = useRef<number>(performance.now());
  const frames = useRef<number>(0);

  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      frames.current += 1;
      const delta = t - last.current;
      if (delta >= 1000) {
        setFps(Math.round((frames.current * 1000) / delta));
        frames.current = 0;
        last.current = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggleSuave = () => {
    const root = document.documentElement;
    const enable = !root.classList.contains('modo-suave');
    root.classList.toggle('modo-suave', enable);
    try { localStorage.setItem('modo_suave', String(enable)); } catch {}
  };

  if (!import.meta.env.DEV) return null;
  if (!visible) return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button variant="outline" size="sm" onClick={() => setVisible(true)}>Perf</Button>
    </div>
  );

  return (
    <div className="fixed bottom-6 left-6 z-50 glass-cosmic rounded-lg p-3 shadow">
      <div className="text-sm">FPS: {fps}</div>
      <div className="flex gap-2 mt-2">
        <Button variant="outline" size="sm" onClick={toggleSuave} aria-label="Alternar modo suave">Modo Suave</Button>
        <Button variant="ghost" size="sm" onClick={() => setVisible(false)} aria-label="Ocultar overlay">Ocultar</Button>
      </div>
    </div>
  );
};

