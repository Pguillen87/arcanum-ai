import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { RuneIcon } from '@/components/cosmic/RuneIcon';
import { Wand2, Sparkles, MoonStar, Atom, Volume2, VolumeX } from 'lucide-react';

type Step = 'boas_vindas' | 'explorar' | 'acao' | 'conclusao';
type Personalidade = 'mago_lumen' | 'bruxa_brumas' | 'alquimista_codigos' | 'elementais';
type Intensidade = 'suave' | 'padrao' | 'profundo';

const LS_KEY = 'arcanoMentorPrefs';

interface MentorPrefs {
  enabled: boolean;
  step: Step;
  personalidade: Personalidade;
  intensidade: Intensidade;
  somAtivo: boolean;
}

const defaultPrefs: MentorPrefs = {
  enabled: true,
  step: 'boas_vindas',
  personalidade: 'mago_lumen',
  intensidade: 'padrao',
  somAtivo: false,
};

function loadPrefs(): MentorPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw);
    return { ...defaultPrefs, ...parsed };
  } catch {
    return defaultPrefs;
  }
}

function savePrefs(p: MentorPrefs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {}
}

export const ArcanoMentor: React.FC<{ section?: 'dashboard' | 'essencia' | 'energia' | 'protecao' | 'cosmos' }>
  = ({ section = 'dashboard' }) => {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<MentorPrefs>(() => loadPrefs());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamsRef = useRef<MediaStream[]>([]);

  useEffect(() => { savePrefs(prefs); }, [prefs]);

  // Conteúdo contextual por seção
  const contexto = useMemo(() => {
    switch (section) {
      case 'essencia': return { titulo: 'Essência Pessoal', dica: 'Refine sua assinatura energética.' };
      case 'energia': return { titulo: 'Fluxos de Energia', dica: 'Ajuste a vibração do conteúdo.' };
      case 'protecao': return { titulo: 'Proteção Arcana', dica: 'Configure escudos e privacidade.' };
      case 'cosmos': return { titulo: 'Rota Cósmica', dica: 'Navegue portais de transmutação.' };
      default: return { titulo: 'Laboratório Místico', dica: 'Explore seus portais criativos.' };
    }
  }, [section]);

  // FSM — transições simples
  const next = () => setPrefs(prev => ({ ...prev,
    step: prev.step === 'boas_vindas' ? 'explorar'
      : prev.step === 'explorar' ? 'acao'
      : prev.step === 'acao' ? 'conclusao'
      : 'conclusao' }));
  const back = () => setPrefs(prev => ({ ...prev,
    step: prev.step === 'conclusao' ? 'acao'
      : prev.step === 'acao' ? 'explorar'
      : prev.step === 'explorar' ? 'boas_vindas'
      : 'boas_vindas' }));

  const toggleEnabled = () => setPrefs(prev => ({ ...prev, enabled: !prev.enabled }));

  const setPersonalidade = (p: Personalidade) => setPrefs(prev => ({ ...prev, personalidade: p }));
  const setIntensidade = (i: Intensidade) => setPrefs(prev => ({ ...prev, intensidade: i }));

  const toggleSom = async () => {
    // Habilita som apenas após gesto. Cria AudioContext sob demanda.
    if (!audioCtxRef.current && !prefs.somAtivo) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {}
    }
    setPrefs(prev => ({ ...prev, somAtivo: !prev.somAtivo }));
  };

  // Permissões de mídia — solicitar apenas após gesto do usuário
  const solicitarMicrofone = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamsRef.current.push(stream);
    } catch {
      // silenciar erros; não logar PII
    }
  };

  const solicitarCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamsRef.current.push(stream);
    } catch {}
  };

  // Revoga media streams ao fechar overlay
  useEffect(() => {
    if (!open && mediaStreamsRef.current.length) {
      for (const s of mediaStreamsRef.current) {
        try { s.getTracks().forEach(t => t.stop()); } catch {}
      }
      mediaStreamsRef.current = [];
    }
  }, [open]);

  const personaLabel: Record<Personalidade, string> = {
    mago_lumen: 'Mago da Lumen',
    bruxa_brumas: 'Bruxa das Brumas',
    alquimista_codigos: 'Alquimista de Códigos',
    elementais: 'Elementais',
  };

  const intensidadeLabel: Record<Intensidade, string> = {
    suave: 'Suave',
    padrao: 'Padrão',
    profundo: 'Profundo',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <CosmicButton mystical onClick={() => setOpen(true)} aria-label="Abrir Guia Mago">
        <Wand2 className="w-4 h-4" /> Abrir Guia Mago
      </CosmicButton>

      <CosmicButton variant="outline" onClick={toggleEnabled} aria-label="Habilitar/Desabilitar Guia">
        {prefs.enabled ? 'Desabilitar Guia' : 'Habilitar Guia'}
      </CosmicButton>

      <Dialog.Root open={open && prefs.enabled} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed inset-0 flex items-center justify-center p-6"
            aria-label="ArcanoMentor"
            aria-modal="true"
            role="dialog"
          >
            <div className="max-w-2xl w-full">
              <CosmicCard title={contexto.titulo} description={contexto.dica} glow>
                {/* Microinterações sutis */}
                <div className="flex items-center gap-3 mb-4">
                  <RuneIcon icon={Sparkles} size="sm" />
                  <RuneIcon icon={MoonStar} size="sm" />
                  <RuneIcon icon={Atom} size="sm" />
                </div>

                {/* Controle de personalidade e intensidade */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm mb-2">Personalidade</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(personaLabel).map((k) => {
                        const key = k as Personalidade;
                        return (
                          <CosmicButton key={key} variant={prefs.personalidade === key ? 'default' : 'outline'}
                            onClick={() => setPersonalidade(key)} aria-label={`Escolher ${personaLabel[key]}`}>
                            {personaLabel[key]}
                          </CosmicButton>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm mb-2">Intensidade</p>
                    <div className="flex flex-wrap gap-2">
                      {(['suave','padrao','profundo'] as Intensidade[]).map((i) => (
                        <CosmicButton key={i} variant={prefs.intensidade === i ? 'default' : 'outline'}
                          onClick={() => setIntensidade(i)} aria-label={`Intensidade ${intensidadeLabel[i]}`}>
                          {intensidadeLabel[i]}
                        </CosmicButton>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggle Som Arcano sem autoplay */}
                <div className="flex items-center gap-2 mb-6">
                  <CosmicButton variant="outline" onClick={toggleSom} aria-label="Alternar Som Arcano">
                    {prefs.somAtivo ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    Som Arcano
                  </CosmicButton>
                  {!prefs.somAtivo && (
                    <span className="text-xs text-muted-foreground">Sem autoplay — habilite após gesto.</span>
                  )}
                </div>

                {/* Permissões de mídia (microfone/câmera) somente após gesto */}
                <div className="flex items-center gap-2 mb-6">
                  <CosmicButton variant="outline" onClick={solicitarMicrofone} aria-label="Permitir Microfone">
                    Permitir Microfone
                  </CosmicButton>
                  <CosmicButton variant="outline" onClick={solicitarCamera} aria-label="Permitir Câmera">
                    Permitir Câmera
                  </CosmicButton>
                  <span className="text-xs text-muted-foreground">Solicitado apenas após clique; revogamos ao fechar.</span>
                </div>

                {/* Fluxo do wizard (FSM) */}
                {prefs.step === 'boas_vindas' && (
                  <div className="space-y-3">
                    <p>Bem-vinda(o)! Eu sou seu guia místico. Vamos explorar?</p>
                    <div className="flex gap-2">
                      <CosmicButton mystical onClick={next}>Avançar</CosmicButton>
                      <CosmicButton variant="outline" onClick={() => setOpen(false)}>Fechar</CosmicButton>
                    </div>
                  </div>
                )}

                {prefs.step === 'explorar' && (
                  <div className="space-y-3">
                    <p>Explore os portais e sinta as runas guiarem seus passos.</p>
                    <div className="flex gap-2">
                      <CosmicButton onClick={back}>Voltar</CosmicButton>
                      <CosmicButton mystical onClick={next}>Avançar</CosmicButton>
                    </div>
                  </div>
                )}

                {prefs.step === 'acao' && (
                  <div className="space-y-3">
                    <p>Escolha uma ação: abrir um portal, ajustar energia, ou refinar essência.</p>
                    <div className="flex gap-2">
                      <CosmicButton onClick={back}>Voltar</CosmicButton>
                      <CosmicButton mystical onClick={next}>Concluir</CosmicButton>
                    </div>
                  </div>
                )}

                {prefs.step === 'conclusao' && (
                  <div className="space-y-3">
                    <p>Conclusão do ritual. Que a luz dourada acompanhe suas criações.</p>
                    <div className="flex gap-2">
                      <CosmicButton onClick={() => setPrefs(prev => ({ ...prev, step: 'boas_vindas' }))}>Reiniciar</CosmicButton>
                      <CosmicButton mystical onClick={() => setOpen(false)}>Fechar</CosmicButton>
                    </div>
                  </div>
                )}
              </CosmicCard>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
