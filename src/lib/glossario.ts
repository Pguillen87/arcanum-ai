type Locale = 'pt-BR' | 'en';

const dicionario: Record<string, Record<Locale, { mystical: string; neutral: string }>> = {
  'auth.login': {
    'pt-BR': { mystical: 'Abrir o Portal', neutral: 'Entrar' },
    en: { mystical: 'Open the Portal', neutral: 'Sign in' },
  },
  'auth.welcome_back': {
    'pt-BR': { mystical: 'Bem-vindo de volta', neutral: 'Bem-vindo' },
    en: { mystical: 'Welcome Back', neutral: 'Welcome' },
  },
  'profile.title': {
    'pt-BR': { mystical: 'Essência Pessoal', neutral: 'Meu Perfil' },
    en: { mystical: 'Personal Essence', neutral: 'My Profile' },
  },
  'settings.title': {
    'pt-BR': { mystical: 'Círculo de Ajustes', neutral: 'Configurações' },
    en: { mystical: 'Circle of Adjustments', neutral: 'Settings' },
  },
  'support.title': {
    'pt-BR': { mystical: 'Oráculo de Ajuda', neutral: 'Suporte' },
    en: { mystical: 'Oracle of Help', neutral: 'Support' },
  },
  'upgrade.premium': {
    'pt-BR': { mystical: 'Grau Arcano Superior', neutral: 'Versão Premium' },
    en: { mystical: 'Higher Arcane Degree', neutral: 'Premium' },
  },
  'tutorials.title': {
    'pt-BR': { mystical: 'Pergaminhos de Sabedoria', neutral: 'Tutoriais' },
    en: { mystical: 'Scrolls of Wisdom', neutral: 'Tutorials' },
  },
};

export function getLabel(
  key: keyof typeof dicionario,
  opts?: { mystical?: boolean; locale?: Locale }
): string {
  const locale: Locale = opts?.locale || 'pt-BR';
  const mystical = opts?.mystical ?? true;
  const entry = dicionario[key];
  if (!entry) return String(key);
  const lang = entry[locale] || entry['pt-BR'];
  return mystical ? lang.mystical : lang.neutral;
}