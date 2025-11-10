// supabase/functions/_shared/security.ts
// Headers de segurança e validações para Edge Functions

/**
 * Headers de segurança padrão para respostas
 */
export const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Origens permitidas para CORS (produção)
 */
const ALLOWED_ORIGINS = [
  'https://arcanum-ai.vercel.app',
  'https://app.arcanum-ai.com',
];

/**
 * Verifica se é uma origem localhost (desenvolvimento)
 */
function isLocalhostOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Obtém headers CORS baseados na origem da requisição
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Permitir qualquer localhost em desenvolvimento
  if (isLocalhostOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400', // 24 horas
    };
  }

  // Para produção, verificar lista de origens permitidas
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // Fallback para primeira origem

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400', // 24 horas
  };
}

/**
 * Combina headers de segurança com CORS
 */
export function getSecurityHeaders(origin: string | null): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    ...getCorsHeaders(origin),
  };
}

/**
 * Valida origem da requisição (prevenção CSRF)
 */
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Permitir localhost em desenvolvimento
  if (isLocalhostOrigin(origin)) {
    return true;
  }
  
  // Verificar se origem está na lista permitida (produção)
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Verificar referer como fallback
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isLocalhostOrigin(refererOrigin)) {
        return true;
      }
      return ALLOWED_ORIGINS.includes(refererOrigin);
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Valida UUID
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

