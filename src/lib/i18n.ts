type Locale = 'pt-BR' | 'en';

const dict: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    'app.title': 'Arcanum.AI',
    'hero.portal': 'Portal de Transmutação Criativa',
    'hero.start': 'Iniciar Jornada',
    'hero.explore': 'Explorar Portal',
    'nav.choose': 'Desperte o Mago que Há em Você',
    'nav.navigate': 'Escolha o portal que ressoa com sua essência criativa',
  },
  en: {
    'app.title': 'Arcanum.AI',
    'hero.portal': 'Portal of Creative Transmutation',
    'hero.start': 'Start Journey',
    'hero.explore': 'Explore Portal',
    'nav.choose': 'Awaken the Wizard Within You',
    'nav.navigate': 'Choose the portal that resonates with your creative essence',
  },
};

export function t(key: keyof typeof dict['pt-BR'], locale: Locale = 'pt-BR') {
  const table = dict[locale] || dict['pt-BR'];
  return table[key] || String(key);
}

