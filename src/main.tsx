import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import { Observability } from "./lib/observability";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Initialize theme
try {
  const savedTheme = typeof window !== 'undefined' && localStorage.getItem("theme") || "dark";
  document.documentElement.classList.add(savedTheme);
} catch (error) {
  // Fallback se localStorage não estiver disponível (SSR, etc)
  document.documentElement.classList.add("dark");
}

// Reduced motion: aplica classe global se o usuário preferir menos movimento
try {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    document.documentElement.classList.add('reduced-motion');
  }
  mq.addEventListener?.('change', (e) => {
    document.documentElement.classList.toggle('reduced-motion', e.matches);
  });
} catch {}

// Alto contraste: aplica classe se preferido
try {
  const hc = localStorage.getItem('high_contrast');
  if (hc === 'true') {
    document.documentElement.classList.add('alto-contraste');
  }
} catch {}

// Observabilidade: inicializa handlers globais com scrubbing de PII
try {
  Observability.init();
} catch {}

// Modo suave: degrada animações em devices modestos
try {
  const suave = localStorage.getItem('modo_suave');
  if (suave === 'true') {
    document.documentElement.classList.add('modo-suave');
  }
} catch {}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <I18nProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nProvider>
  </ErrorBoundary>
);
