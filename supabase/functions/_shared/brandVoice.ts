// supabase/functions/_shared/brandVoice.ts
// Função de compatibilidade para buscar Brand Voice com fallback

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, supabaseServiceKey);

export interface BrandVoiceResult {
  source: 'brand_profiles' | 'profiles.brand_voice';
  data: any;
}

/**
 * Busca voz da marca com fallback automático
 * 1. Se brandProfileId fornecido, buscar em brand_profiles
 * 2. Buscar voz padrão em brand_profiles
 * 3. Fallback para profiles.brand_voice (compatibilidade)
 */
export async function getBrandVoiceForUser(
  userId: string,
  brandProfileId?: string
): Promise<BrandVoiceResult | null> {
  try {
    // 1. Se brandProfileId fornecido, buscar em brand_profiles
    if (brandProfileId) {
      const { data: profile, error } = await admin
        .from('brand_profiles')
        .select('*')
        .eq('id', brandProfileId)
        .eq('user_id', userId)
        .single();
      
      if (!error && profile) {
        return { source: 'brand_profiles', data: profile };
      }
    }
    
    // 2. Buscar voz padrão em brand_profiles
    const { data: defaultProfile, error: defaultError } = await admin
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();
    
    if (!defaultError && defaultProfile) {
      return { source: 'brand_profiles', data: defaultProfile };
    }
    
    // 3. Fallback para profiles.brand_voice (compatibilidade)
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('brand_voice')
      .eq('id', userId)
      .single();
    
    if (!profileError && profile?.brand_voice) {
      return { 
        source: 'profiles.brand_voice', 
        data: { brand_voice: profile.brand_voice } 
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar brand voice:', error);
    return null;
  }
}

