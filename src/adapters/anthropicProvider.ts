// src/adapters/anthropicProvider.ts
// Implementação do Anthropic Provider

import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, GenerateTextParams, GenerateTextResponse } from './aiProvider';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic' as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    const systemPrompt = params.systemPrompt || '';
    const userPrompt = params.prompt;

    const response = await this.client.messages.create({
      model: params.model || 'claude-3-5-sonnet-20241022',
      max_tokens: params.maxTokens ?? 2000,
      temperature: params.temperature ?? 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    const text = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map(c => c.text)
      .join('');

    return {
      text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: params.model || 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
    };
  }

  // Anthropic não tem API de embeddings nativa
  // Usar OpenAI para embeddings mesmo quando provider é Anthropic
  async generateEmbedding(text: string): Promise<number[]> {
    throw new Error('Anthropic não suporta embeddings. Use OpenAI para embeddings.');
  }
}

