// src/adapters/aiProvider.ts
// Interface comum para providers de IA

export interface GenerateTextParams {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GenerateTextResponse {
  text: string;
  tokensUsed?: number;
  model: string;
  provider: string;
}

export interface AIProvider {
  name: 'openai' | 'anthropic';
  generateText(params: GenerateTextParams): Promise<GenerateTextResponse>;
  generateEmbedding(text: string): Promise<number[]>;
}

