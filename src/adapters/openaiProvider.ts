// src/adapters/openaiProvider.ts
// Implementação do OpenAI Provider

import OpenAI from 'openai';
import { AIProvider, GenerateTextParams, GenerateTextResponse } from './aiProvider';

export class OpenAIProvider implements AIProvider {
  name = 'openai' as const;
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    const response = await this.client.chat.completions.create({
      model: params.model || 'gpt-4o',
      messages: [
        ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2000,
    });

    return {
      text: response.choices[0]?.message?.content || '',
      tokensUsed: response.usage?.total_tokens,
      model: params.model || 'gpt-4o',
      provider: 'openai',
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }
}

