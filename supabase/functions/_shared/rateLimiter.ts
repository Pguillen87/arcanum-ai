// supabase/functions/_shared/rateLimiter.ts
// Rate limiting para Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, supabaseServiceKey);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS = {
  training: {
    free: { maxRequests: 2, windowMs: 24 * 60 * 60 * 1000 }, // 2 por dia
    premium: { maxRequests: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20 por dia
  },
  transformation: {
    free: { maxRequests: 50, windowMs: 24 * 60 * 60 * 1000 }, // 50 por dia
    premium: { maxRequests: 500, windowMs: 24 * 60 * 60 * 1000 }, // 500 por dia
  },
  embedding: {
    free: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 por hora
    premium: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 por hora
  },
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Verifica rate limit para uma operação específica
 */
export async function checkRateLimit(
  userId: string,
  operation: 'training' | 'transformation' | 'embedding',
  plan: 'free' | 'premium'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[operation][plan];
  const windowStart = new Date(Date.now() - config.windowMs);

  try {
    // Contar requisições na janela de tempo usando credit_transactions
    const { count } = await admin
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reason', `brand_voice_${operation}`)
      .gte('created_at', windowStart.toISOString());

    const currentCount = count || 0;
    const allowed = currentCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetAt = new Date(Date.now() + config.windowMs);

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('Erro ao verificar rate limit:', error);
    // Em caso de erro, permitir por segurança (mas logar)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

/**
 * Rate limiting por IP (em memória - usar KV store em produção)
 */
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkIPRateLimit(
  ip: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 60 * 1000 // 1 hora
): boolean {
  const now = Date.now();
  const limit = ipRateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Obtém IP do request
 */
export function getRequestIP(request: Request): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

