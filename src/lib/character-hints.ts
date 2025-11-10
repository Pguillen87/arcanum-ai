// src/lib/character-hints.ts
// Constantes com todas as hints informativas para criação de personagens

export interface CharacterHint {
  title: string;
  description: string;
  why?: string;
  examples?: string[];
  tips?: string;
}

export const CHARACTER_HINTS: Record<string, Record<string, CharacterHint>> = {
  // Campos básicos
  basic: {
    name: {
      title: 'Nome do Personagem',
      description: 'O nome que identifica esta essência criativa única. Use um nome que reflita a personalidade e propósito do personagem.',
      why: 'O nome ajuda você a identificar rapidamente qual personagem usar em diferentes contextos e projetos.',
      examples: [
        'Mago Sábio - Para conteúdo educacional e técnico',
        'Bruxa Criativa - Para conteúdo artístico e inspirador',
        'Alquimista Prático - Para conteúdo de negócios e estratégia',
        'Transgressor Cósmico - Para conteúdo provocador e inovador',
      ],
      tips: 'Escolha nomes que evoquem a essência do personagem. Você pode ter múltiplos personagens para diferentes propósitos.',
    },
    description: {
      title: 'Descrição',
      description: 'Uma breve descrição sobre quando e como usar este personagem.',
      why: 'Facilita a escolha do personagem certo para cada situação, especialmente quando você tem vários personagens criados.',
      examples: [
        'Use para posts educacionais e tutoriais técnicos.',
        'Ideal para conteúdo criativo e inspirador.',
        'Perfeito para estratégias de negócios.',
      ],
      tips: 'Seja específico sobre o contexto de uso. Isso economiza tempo na escolha.',
    },
    avatar_url: {
      title: 'URL do Avatar',
      description: 'URL de uma imagem que representa visualmente este personagem. Pode ser um link para uma imagem hospedada.',
      why: 'Um avatar visual ajuda a identificar rapidamente o personagem na biblioteca e cria uma conexão emocional.',
      examples: [
        'https://exemplo.com/avatar-mago.png',
        'https://exemplo.com/bruxa-criativa.jpg',
      ],
      tips: 'Use imagens quadradas (1:1) para melhor visualização. O avatar é opcional mas recomendado.',
    },
    model_provider: {
      title: 'Provedor do Modelo',
      description: 'Escolha entre OpenAI (GPT-4o) ou Anthropic (Claude 3.5 Sonnet) como motor de IA para este personagem.',
      why: 'Diferentes modelos têm características distintas. GPT-4o é mais rápido e direto, Claude é mais criativo e detalhado.',
      examples: [
        'OpenAI GPT-4o: Mais rápido, bom para respostas diretas e técnicas',
        'Anthropic Claude: Mais criativo, ideal para conteúdo narrativo e poético',
      ],
      tips: 'Você pode testar ambos e escolher o que funciona melhor para cada personagem.',
    },
    is_default: {
      title: 'Personagem Padrão',
      description: 'Marque para definir este personagem como padrão. Será usado automaticamente quando nenhum outro for selecionado.',
      why: 'Ter um personagem padrão acelera o fluxo de trabalho, especialmente se você usa um personagem principal com frequência.',
      examples: [
        'Se você tem um personagem principal para seu negócio, marque-o como padrão',
        'Você pode mudar o padrão a qualquer momento',
      ],
      tips: 'Apenas um personagem pode ser padrão por vez. Ao marcar este, o anterior será desmarcado automaticamente.',
    },
  },

  // Dimensão 1: Núcleo de Personalidade
  personality_core: {
    robotic_human: {
      title: 'Robótico ↔ Humano',
      description: 'Define o nível de humanidade na comunicação. Valores baixos = linguagem técnica, valores altos = comunicação natural e empática.',
      why: 'Personagens mais humanos soam naturais e empáticos, ideais para conteúdo emocional. Robóticos são mais técnicos e precisos.',
      examples: [
        '0-30%: "Análise completa. Dados processados. Conclusão: eficiência otimizada."',
        '50%: "Analisando os dados, parece que temos uma boa oportunidade aqui."',
        '70-100%: "Olha, quando eu vejo esses números, meu coração até acelera! Que oportunidade incrível!"',
      ],
      tips: 'Use valores altos (70-100%) para conteúdo emocional e storytelling. Use baixos (0-30%) para documentação técnica.',
    },
    clown_serious: {
      title: 'Palhaço ↔ Sério',
      description: 'Controla o nível de seriedade e humor na comunicação. Valores baixos criam um tom mais descontraído e brincalhão, valores altos um tom mais sério e profissional.',
      why: 'O nível de seriedade define o tom geral da comunicação. Conteúdo sério transmite autoridade, enquanto conteúdo brincalhão cria conexão e engajamento.',
      examples: [
        '0-30% (Brincalhão): "E aí, pessoal! Bora fazer essa mágica acontecer? 🎩✨ É sério, mas vamos nos divertir no processo!"',
        '50% (Equilibrado): "Vamos explorar essa oportunidade. É um tema importante, mas podemos abordá-lo de forma acessível."',
        '70-100% (Sério): "Este é um assunto de extrema importância que requer nossa atenção imediata e análise cuidadosa."',
      ],
      tips: 'Use valores altos para conteúdo corporativo, educacional formal e assuntos sérios. Use valores baixos para redes sociais, entretenimento e conteúdo descontraído.',
    },
    traits: {
      title: 'Traços de Personalidade',
      description: 'Lista de características específicas que definem a personalidade única do personagem. Adicione palavras-chave que capturem a essência.',
      why: 'Os traços ajudam a refinar ainda mais a personalidade, criando um personagem mais distinto e memorável.',
      examples: [
        'Provocador, Inspirador, Rebelde',
        'Sábio, Paciente, Reflexivo',
        'Energético, Otimista, Motivador',
        'Misterioso, Profundo, Filosófico',
      ],
      tips: 'Use 3-5 traços principais. Seja específico e evite contradições. Exemplo: não combine "reservado" com "expansivo".',
    },
  },

  // Dimensão 2: Tom de Comunicação
  communication_tone: {
    formality: {
      title: 'Formalidade',
      description: 'Define o nível de formalidade na linguagem. Formal usa linguagem profissional e estruturada, casual usa linguagem descontraída e coloquial.',
      why: 'A formalidade adequa o personagem ao contexto. Conteúdo formal transmite autoridade, casual cria proximidade.',
      examples: [
        'Formal: "É com grande satisfação que apresentamos nossa nova solução, desenvolvida após extensa pesquisa e análise de mercado."',
        'Neutro: "Temos uma nova solução que pode ajudar você. Ela foi desenvolvida com base em pesquisas de mercado."',
        'Casual: "Olha só que legal! Criamos uma solução nova que vai te ajudar muito. A gente pesquisou bastante antes de fazer."',
      ],
      tips: 'Use formal para B2B, documentos oficiais e comunicação corporativa. Use casual para redes sociais, conteúdo pessoal e engajamento.',
    },
    enthusiasm: {
      title: 'Entusiasmo',
      description: 'Controla a energia e paixão na comunicação. Baixo entusiasmo é calmo e reservado, alto entusiasmo é energético e apaixonado.',
      why: 'O nível de entusiasmo define a intensidade emocional da mensagem. Alto entusiasmo gera mais engajamento, baixo transmite serenidade.',
      examples: [
        'Baixo: "Esta é uma informação interessante que pode ser útil para você."',
        'Médio: "Esta informação é realmente útil e pode fazer diferença para você!"',
        'Alto: "Uau! Esta informação é INCRÍVEL e vai mudar completamente como você vê isso! Você precisa saber disso AGORA!"',
      ],
      tips: 'Use alto entusiasmo para lançamentos, descobertas e conteúdo motivacional. Use baixo para análises objetivas e informações técnicas.',
    },
    use_emojis: {
      title: 'Usar Emojis',
      description: 'Quando ativado, o personagem pode usar emojis na comunicação para adicionar expressividade e tom emocional.',
      why: 'Emojis tornam a comunicação mais visual e expressiva, ideal para redes sociais e conteúdo descontraído.',
      examples: [
        'Com emojis: "Que ideia incrível! 🚀 Vamos fazer isso acontecer! ✨"',
        'Sem emojis: "Que ideia incrível! Vamos fazer isso acontecer!"',
      ],
      tips: 'Ative para conteúdo de redes sociais, newsletters descontraídas e comunicação jovem. Desative para conteúdo corporativo formal.',
    },
    use_slang: {
      title: 'Usar Gírias',
      description: 'Quando ativado, o personagem pode usar gírias e expressões coloquiais típicas do português brasileiro.',
      why: 'Gírias criam uma conexão mais próxima com o público brasileiro e tornam a comunicação mais autêntica e acessível.',
      examples: [
        'Com gírias: "Mano, essa parada é muito massa! Bora fazer acontecer, véi!"',
        'Sem gírias: "Essa ideia é excelente! Vamos implementá-la."',
      ],
      tips: 'Ative para conteúdo jovem, redes sociais e público descontraído. Desative para comunicação profissional e formal.',
    },
    use_metaphors: {
      title: 'Usar Metáforas',
      description: 'Quando ativado, o personagem usa metáforas e linguagem figurada para tornar conceitos mais acessíveis e memoráveis.',
      why: 'Metáforas ajudam a explicar conceitos complexos de forma simples e criam imagens mentais que facilitam a compreensão.',
      examples: [
        'Com metáforas: "Criar conteúdo é como plantar um jardim: você precisa regar constantemente para ver as flores crescerem."',
        'Sem metáforas: "Criar conteúdo requer consistência e dedicação constante para obter resultados."',
      ],
      tips: 'Ative para conteúdo educativo, storytelling e comunicação inspiradora. Desative para documentação técnica e comunicação direta.',
    },
  },

  // Dimensão 3: Motivação e Foco
  motivation_focus: {
    focus: {
      title: 'Foco Principal',
      description: 'Define o objetivo principal do personagem ao comunicar. Cada foco muda a abordagem e estrutura da mensagem.',
      why: 'O foco principal direciona toda a comunicação do personagem, garantindo que cada mensagem tenha um propósito claro.',
      examples: [
        'Ajudar: "Vou te mostrar como resolver isso passo a passo..."',
        'Ensinar: "Vamos entender os conceitos por trás disso..."',
        'Entreter: "Prepare-se para uma jornada incrível..."',
        'Inspirar: "Imagine o que é possível quando você..."',
        'Vender: "Esta solução vai transformar seus resultados..."',
        'Informar: "Aqui estão os fatos sobre este assunto..."',
      ],
      tips: 'Escolha o foco que melhor se alinha com o propósito do personagem. Você pode ter personagens diferentes para cada foco.',
    },
    seeks: {
      title: 'Busca',
      description: 'Define o que o personagem busca alcançar através da comunicação. Cada busca influencia o tom e a direção das mensagens.',
      why: 'A busca define os valores e objetivos do personagem, criando consistência na comunicação e alinhamento com seus valores.',
      examples: [
        'Harmonia: "Vamos encontrar uma solução que funcione para todos..."',
        'Inovação: "Que tal explorarmos uma abordagem completamente nova?"',
        'Eficiência: "Vamos otimizar isso para obter o máximo resultado..."',
        'Criatividade: "Vamos pensar fora da caixa e criar algo único..."',
        'Clareza: "Vamos simplificar isso para que fique cristalino..."',
      ],
      tips: 'Combine o foco principal com a busca para criar um personagem coerente. Exemplo: Ensinar + Clareza = Educador Claro.',
    },
  },

  // Dimensão 4: Atitude Social
  social_attitude: {
    type: {
      title: 'Tipo de Atitude',
      description: 'Define se o personagem é proativo (toma iniciativa) ou reativo (responde a situações).',
      why: 'A atitude social define como o personagem interage com o mundo. Proativos são líderes, reativos são colaboradores.',
      examples: [
        'Proativo: "Vou criar uma solução para isso agora mesmo. Deixa comigo!"',
        'Reativo: "Entendi o problema. Como posso ajudar você a resolver isso?"',
      ],
      tips: 'Use proativo para conteúdo de liderança e inovação. Use reativo para suporte e colaboração.',
    },
    curiosity: {
      title: 'Curiosidade',
      description: 'Controla o nível de curiosidade e exploração do personagem. Alta curiosidade faz mais perguntas e explora mais.',
      why: 'A curiosidade define o nível de exploração e questionamento. Alta curiosidade cria conteúdo mais investigativo e profundo.',
      examples: [
        'Baixa: "Esta é a informação que você precisa."',
        'Média: "Vamos explorar isso juntos e ver o que descobrimos."',
        'Alta: "Isso me faz pensar... e se explorássemos isso de outro ângulo? Que outras possibilidades existem?"',
      ],
      tips: 'Use alta curiosidade para conteúdo educativo e investigativo. Use baixa para comunicação direta e objetiva.',
    },
    reserved_expansive: {
      title: 'Reservado ↔ Expansivo',
      description: 'Define quanto o personagem compartilha e se abre. Reservado é mais contido, expansivo compartilha mais detalhes e experiências.',
      why: 'O nível de abertura define a profundidade da comunicação. Expansivo cria conexão emocional, reservado mantém profissionalismo.',
      examples: [
        '0-30% (Reservado): "Aqui está a informação que você solicitou."',
        '50% (Equilibrado): "Vou compartilhar algumas informações relevantes sobre isso."',
        '70-100% (Expansivo): "Deixa eu te contar uma experiência pessoal que mudou minha perspectiva sobre isso..."',
      ],
      tips: 'Use expansivo para storytelling, conteúdo pessoal e conexão emocional. Use reservado para comunicação profissional e objetiva.',
    },
  },

  // Dimensão 5: Velocidade Cognitiva
  cognitive_speed: {
    speed: {
      title: 'Velocidade Cognitiva',
      description: 'Define a velocidade de processamento e resposta do personagem. Lenta é mais reflexiva, rápida é mais ágil e direta.',
      why: 'A velocidade cognitiva afeta o ritmo da comunicação. Rápida é dinâmica, lenta é profunda e reflexiva.',
      examples: [
        'Lenta: "Deixe-me refletir sobre isso cuidadosamente... Após considerar todos os aspectos..."',
        'Média: "Vamos analisar isso e chegar a uma conclusão."',
        'Rápida: "Perfeito! Já tenho a solução. Vamos fazer assim..."',
      ],
      tips: 'Use rápida para conteúdo dinâmico e ação imediata. Use lenta para análises profundas e reflexões filosóficas.',
    },
    depth: {
      title: 'Profundidade Cognitiva',
      description: 'Controla o nível de profundidade na análise. Superficial é direto ao ponto, profundo explora camadas e nuances.',
      why: 'A profundidade define o nível de detalhamento. Profunda cria conteúdo mais rico, superficial é mais acessível.',
      examples: [
        'Superficial: "Isso funciona porque é eficiente."',
        'Média: "Isso funciona porque otimiza o processo e reduz fricção."',
        'Profunda: "Isso funciona porque opera em múltiplas camadas: primeiro otimiza o processo, depois reduz fricção cognitiva, e finalmente cria um ciclo de feedback positivo que..."',
      ],
      tips: 'Use profunda para conteúdo educativo avançado e análises complexas. Use superficial para comunicação rápida e direta.',
    },
  },

  // Dimensão 6: Estilo de Vocabulário
  vocabulary_style: {
    style: {
      title: 'Estilo de Vocabulário',
      description: 'Define o estilo de linguagem usado pelo personagem. Cada estilo tem características distintas de vocabulário e estrutura.',
      why: 'O estilo de vocabulário cria a identidade única da voz do personagem, diferenciando-o de outros personagens.',
      examples: [
        'Neutro: "Esta é uma solução eficiente para o problema."',
        'Simples: "Essa solução resolve o problema de forma fácil."',
        'Complexo: "Esta solução representa uma abordagem sofisticada para resolver o problema."',
        'Poético: "Como uma brisa suave, esta solução dança entre os problemas e os dissolve."',
        'Técnico: "Esta solução implementa um algoritmo otimizado que resolve o problema com eficiência O(n log n)."',
      ],
      tips: 'Escolha o estilo que melhor representa a personalidade do personagem. Poético para criativo, técnico para profissional.',
    },
    complexity: {
      title: 'Complexidade do Vocabulário',
      description: 'Controla a complexidade das palavras usadas. Baixa usa palavras simples, alta usa vocabulário mais sofisticado.',
      why: 'A complexidade adequa o personagem ao público. Simples é mais acessível, complexo transmite expertise.',
      examples: [
        'Baixa: "Vamos fazer isso de forma fácil."',
        'Média: "Vamos implementar isso de forma eficiente."',
        'Alta: "Vamos implementar isso utilizando uma metodologia sofisticada que otimiza os resultados."',
      ],
      tips: 'Use baixa complexidade para público geral e iniciantes. Use alta para especialistas e conteúdo técnico avançado.',
    },
    use_figures: {
      title: 'Usar Figuras de Linguagem',
      description: 'Quando ativado, o personagem usa figuras de linguagem como metáforas, analogias e comparações para enriquecer a comunicação.',
      why: 'Figuras de linguagem tornam a comunicação mais rica, memorável e envolvente, facilitando a compreensão de conceitos complexos.',
      examples: [
        'Com figuras: "Criar conteúdo é como tecer uma tapeçaria: cada fio conta uma história, e juntos criam algo belo."',
        'Sem figuras: "Criar conteúdo requer atenção aos detalhes e integração de elementos diversos."',
      ],
      tips: 'Ative para conteúdo criativo, educativo e storytelling. Desative para documentação técnica e comunicação direta.',
    },
  },

  // Dimensão 7: Estado Emocional
  emotional_state: {
    current: {
      title: 'Estado Emocional Atual',
      description: 'Define o estado emocional base do personagem. Este estado influencia o tom geral da comunicação.',
      why: 'O estado emocional cria a atmosfera da comunicação. Cada estado transmite sentimentos diferentes ao público.',
      examples: [
        'Neutro: "Vamos analisar essa situação."',
        'Feliz: "Que alegria poder compartilhar isso com você!"',
        'Calmo: "Vamos abordar isso com serenidade e clareza."',
        'Animado: "Estou super empolgado para te mostrar isso!"',
      ],
      tips: 'Escolha um estado emocional que se alinha com o propósito do personagem. Você pode ajustar depois se necessário.',
    },
    variability: {
      title: 'Variabilidade Emocional',
      description: 'Controla o quanto o estado emocional varia durante a comunicação. Baixa mantém consistência, alta permite variações emocionais.',
      why: 'A variabilidade define se o personagem mantém um tom consistente ou permite variações emocionais mais dinâmicas.',
      examples: [
        'Baixa: Mantém sempre o mesmo tom emocional',
        'Média: Permite algumas variações sutis',
        'Alta: Pode variar entre diferentes estados emocionais conforme o contexto',
      ],
      tips: 'Use baixa variabilidade para comunicação profissional consistente. Use alta para conteúdo dinâmico e expressivo.',
    },
  },

  // Dimensão 8: Valores e Tendências
  values_tendencies: {
    values: {
      title: 'Valores e Tendências',
      description: 'Lista de valores e tendências que guiam o personagem. Esses valores influenciam decisões e comunicação.',
      why: 'Os valores definem os princípios do personagem, criando consistência e autenticidade na comunicação.',
      examples: [
        'Ético, Pragmático, Inovador',
        'Criativo, Autêntico, Inspirador',
        'Tradicional, Estável, Confiável',
        'Neutro, Equilibrado, Adaptável',
      ],
      tips: 'Escolha 2-4 valores principais que representam o personagem. Valores opostos podem criar inconsistência.',
    },
  },
};

// Helper para obter hint de forma segura
export function getCharacterHint(
  dimension: string,
  field: string
): CharacterHint | null {
  return CHARACTER_HINTS[dimension]?.[field] || null;
}

// Helper para obter todas as hints de uma dimensão
export function getDimensionHints(dimension: string): Record<string, CharacterHint> | null {
  return CHARACTER_HINTS[dimension] || null;
}


