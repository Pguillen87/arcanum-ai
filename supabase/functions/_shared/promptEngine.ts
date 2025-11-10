// Módulo compartilhado para construção de prompts de transformação e voz de personagem

export type TransformationType = "post" | "resumo" | "newsletter" | "roteiro";

export function buildTransformPrompt(
  params: { type: TransformationType; tone?: string; length?: "short" | "medium" | "long" },
  inputText: string
): string {
  const typePrompts: Record<TransformationType, string> = {
    post: "Transforme o seguinte texto em um post para redes sociais, mantendo a essência e tornando-o envolvente e conciso.",
    resumo: "Crie um resumo objetivo e claro do seguinte texto, destacando os pontos principais.",
    newsletter: "Transforme o seguinte conteúdo em uma newsletter profissional e informativa, com estrutura clara e tom adequado.",
    roteiro: "Crie um roteiro estruturado baseado no seguinte conteúdo, com cenas, diálogos e direções quando apropriado.",
  };
  const basePrompt = typePrompts[params.type] || typePrompts.post;
  const lengthInstruction = params.length === "short" ? " Mantenha o conteúdo conciso." : " Pode ser mais detalhado.";
  const toneInstruction = params.tone ? ` Use um tom ${params.tone}.` : "";
  return `${basePrompt}${lengthInstruction}${toneInstruction}\n\nTexto original:\n${inputText}`;
}

export function buildBrandVoiceFromCharacter(character: any): any {
  const {
    personality_core,
    communication_tone,
    motivation_focus,
    social_attitude,
    cognitive_speed,
    vocabulary_style,
    emotional_state,
    values_tendencies,
  } = character || {};

  const tone = communication_tone?.formality || "neutral";
  const style = vocabulary_style?.style || "neutral";

  const preferences: any = {
    formality: tone,
    length:
      vocabulary_style?.complexity === "high"
        ? "long"
        : vocabulary_style?.complexity === "low"
        ? "short"
        : "medium",
    creativity:
      cognitive_speed?.speed === "fast"
        ? "high"
        : cognitive_speed?.speed === "slow"
        ? "low"
        : "medium",
  };

  const personalityInstructions: string[] = [];
  if (personality_core?.robotic_human !== undefined) {
    const humanLevel = personality_core.robotic_human;
    if (humanLevel > 70) personalityInstructions.push("Tom mais humano e natural");
    else if (humanLevel < 30) personalityInstructions.push("Tom mais técnico e preciso");
  }
  if (personality_core?.clown_serious !== undefined) {
    const seriousLevel = personality_core.clown_serious;
    if (seriousLevel > 70) personalityInstructions.push("Tom sério e profissional");
    else if (seriousLevel < 30) personalityInstructions.push("Tom descontraído e amigável");
  }
  if (communication_tone?.enthusiasm) {
    const enthusiasm = communication_tone.enthusiasm;
    if (enthusiasm === "high") personalityInstructions.push("Tom entusiasmado e energético");
    else if (enthusiasm === "low") personalityInstructions.push("Tom calmo e reservado");
  }
  if (motivation_focus?.focus) personalityInstructions.push(`Foco principal: ${motivation_focus.focus}`);
  if (values_tendencies && values_tendencies.length > 0) personalityInstructions.push(`Valores: ${values_tendencies.join(", ")}`);

  return { tone, style, preferences, personalityInstructions, examples: [] };
}

export function applyBrandVoice(prompt: string, brandVoice: any): string {
  if (!brandVoice || typeof brandVoice !== "object") return prompt;

  const tone = brandVoice.tone || "";
  const style = brandVoice.style || "";
  const examples = brandVoice.examples || [];
  const preferences = brandVoice.preferences || {};

  let enhancedPrompt = prompt;
  const brandInstructions: string[] = [];

  if (tone) brandInstructions.push(`Tom: ${tone}`);
  if (style) brandInstructions.push(`Estilo: ${style}`);

  if (preferences.length) {
    const lengthMap: Record<string, string> = {
      short: "conciso e direto",
      medium: "equilibrado",
      long: "detalhado e completo",
    };
    brandInstructions.push(`Tamanho preferido: ${lengthMap[preferences.length] || "equilibrado"}`);
  }
  if (preferences.formality) {
    const formalityMap: Record<string, string> = {
      formal: "formal e profissional",
      neutral: "neutro",
      casual: "casual e descontraído",
    };
    brandInstructions.push(`Formalidade: ${formalityMap[preferences.formality] || "neutro"}`);
  }
  if (preferences.creativity) {
    const creativityMap: Record<string, string> = {
      low: "mais direto e objetivo",
      medium: "equilibrado",
      high: "mais criativo e inovador",
    };
    brandInstructions.push(`Criatividade: ${creativityMap[preferences.creativity] || "equilibrado"}`);
  }
  if (brandVoice.personalityInstructions?.length) brandInstructions.push(...brandVoice.personalityInstructions);

  if (brandInstructions.length > 0) {
    enhancedPrompt = `Voz da Marca / Personagem:\n${brandInstructions.join("\n")}\n\n${enhancedPrompt}`;
  }
  if (examples.length > 0) {
    enhancedPrompt = `Exemplos de textos no estilo desejado:\n${examples.slice(0, 3).join("\n\n")}\n\n${enhancedPrompt}`;
  }

  return enhancedPrompt;
}
