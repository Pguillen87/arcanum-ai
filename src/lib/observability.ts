type Scrubbed = {
  message: string;
  extra?: Record<string, any>;
};

function scrubPII(input: any): any {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  if (!str) return input;
  let out = str;
  // Emails
  out = out.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '***@***');
  // Tokens (Bearer ...)
  out = out.replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer ***');
  // UUIDs
  out = out.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, '***-uuid-***');
  try {
    return JSON.parse(out);
  } catch {
    return out;
  }
}

const Observability = {
  init() {
    // Sampling reduzido em produção
    const sample = import.meta.env.PROD ? 0.1 : 1.0;
    // Handlers globais
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (e) => {
        if (Math.random() > sample) return;
        Observability.trackError(e.error || e.message);
      });
      window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
        if (Math.random() > sample) return;
        Observability.trackError(e.reason);
      });
    }
  },
  trackEvent(name: string, payload?: Record<string, any>) {
    const data: Scrubbed = { message: name, extra: scrubPII(payload || {}) };
    // Integrar com Sentry/LogRocket se DSN estiver presente
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    const logrocketId = import.meta.env.VITE_LOGROCKET_ID;
    
    if (sentryDsn) {
      // Sentry será inicializado separadamente se DSN estiver configurado
      // @sentry/browser deve ser importado dinamicamente
      try {
        // Placeholder para integração futura: Sentry.captureMessage(name, { extra: data.extra })
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.captureMessage(name, { extra: data.extra });
        }
      } catch (e) {
        // Fallback silencioso se Sentry não estiver disponível
      }
    }
    
    if (logrocketId && typeof window !== 'undefined' && (window as any).LogRocket) {
      try {
        (window as any).LogRocket.track(name, data.extra);
      } catch (e) {
        // Fallback silencioso
      }
    }
    
    // Log local em desenvolvimento
    if (!import.meta.env.PROD) {
      console.info('[event]', data);
    }
  },
  trackError(err: any) {
    const scrubbedError = typeof err === 'string' ? err : err?.message || String(err);
    const data: Scrubbed = { 
      message: scrubPII(scrubbedError),
      extra: err?.stack ? { stack: scrubPII(err.stack) } : undefined
    };
    
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    const logrocketId = import.meta.env.VITE_LOGROCKET_ID;
    
    if (sentryDsn) {
      try {
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.captureException(err);
        }
      } catch (e) {
        // Fallback silencioso
      }
    }
    
    if (logrocketId && typeof window !== 'undefined' && (window as any).LogRocket) {
      try {
        (window as any).LogRocket.captureException(err);
      } catch (e) {
        // Fallback silencioso
      }
    }
    
    // Log local em desenvolvimento
    if (!import.meta.env.PROD) {
      console.error('[error]', data);
    }
  },
  scrub: scrubPII,
};

export { Observability };

