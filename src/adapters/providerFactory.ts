// src/adapters/providerFactory.ts
// Factory para criar providers de IA baseado em plano do usuário

import { AIProvider } from './aiProvider';
import { OpenAIProvider } from './openaiProvider';
import { AnthropicProvider } from './anthropicProvider';

export type ProviderName = 'openai' | 'anthropic';
export type UserPlan = 'free' | 'premium';

/**
 * Cria um provider de IA baseado no nome
 */
export function createProvider(
  providerName: ProviderName,
  apiKey: string
): AIProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    default:
      throw new Error(`Provider desconhecido: ${providerName}`);
  }
}

/**
 * Determina o provider padrão baseado no plano do usuário
 */
export function getDefaultProvider(userPlan: UserPlan): ProviderName {
  return userPlan === 'premium' ? 'anthropic' : 'openai';
}

/**
 * Obtém o modelo padrão para um provider
 */
export function getDefaultModel(provider: ProviderName): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o';
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    default:
      return 'gpt-4o';
  }
}

/**
 * Verifica se um provider pode ser usado pelo plano do usuário
 */
export function canUseProvider(provider: ProviderName, userPlan: UserPlan): boolean {
  if (provider === 'anthropic' && userPlan === 'free') {
    return false;
  }
  return true;
}

