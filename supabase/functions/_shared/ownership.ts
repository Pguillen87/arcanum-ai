// supabase/functions/_shared/ownership.ts
// Validação de ownership para Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Valida se um brand profile pertence ao usuário
 */
export async function validateBrandProfileOwnership(
  userId: string,
  brandProfileId: string
): Promise<boolean> {
  try {
    const { data, error } = await admin
      .from('brand_profiles')
      .select('id')
      .eq('id', brandProfileId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao validar ownership:', error);
    return false;
  }
}

/**
 * Valida se um brand sample pertence ao usuário
 */
export async function validateBrandSampleOwnership(
  userId: string,
  brandSampleId: string
): Promise<boolean> {
  try {
    const { data, error } = await admin
      .from('brand_samples')
      .select('id')
      .eq('id', brandSampleId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao validar ownership de sample:', error);
    return false;
  }
}

