// src/services/characterService.ts
// Service para gerenciar Characters (substitui brandVoiceService)

import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';
import { 
  Character, 
  CharacterSample,
  CreateCharacter,
  UpdateCharacter,
  TrainCharacterRequest,
  TransformWithCharacterRequest,
} from '@/schemas/character';
import { CharacterSchema, CharacterSampleSchema } from '@/schemas/character';

export type { 
  Character, 
  CharacterSample,
  CreateCharacter,
  UpdateCharacter,
  TrainCharacterRequest,
  TransformWithCharacterRequest 
};

export interface CharacterService {
  // CRUD básico
  listCharacters(userId: string): Promise<{ data: Character[] | null; error: any }>;
  getDefaultCharacter(userId: string): Promise<{ data: Character | null; error: any }>;
  getCharacter(characterId: string): Promise<{ data: Character | null; error: any }>;
  createCharacter(userId: string, character: CreateCharacter): Promise<{ data: Character | null; error: any }>;
  updateCharacter(characterId: string, character: UpdateCharacter): Promise<{ data: Character | null; error: any }>;
  deleteCharacter(characterId: string): Promise<{ error: any }>;
  setDefaultCharacter(characterId: string): Promise<{ error: any }>;
  
  // Treinamento e transformação
  trainCharacter(params: TrainCharacterRequest): Promise<{ data: Character | null; error: any }>;
  transformWithCharacter(params: TransformWithCharacterRequest): Promise<{ data: string | null; error: any }>;
  
  // Samples
  listSamples(characterId: string): Promise<{ data: CharacterSample[] | null; error: any }>;
  addSample(characterId: string, sample: Omit<CharacterSample, 'id' | 'character_id' | 'user_id'>): Promise<{ data: CharacterSample | null; error: any }>;
  deleteSample(sampleId: string): Promise<{ error: any }>;
}

export const characterService: CharacterService = {
  async listCharacters(userId: string) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Tratar erro 404 (tabela não existe) como estado válido
      if (error) {
        const isTableNotFound = 
          error.code === 'PGRST116' || 
          error.status === 404 || 
          error.message?.includes('relation "characters" does not exist') ||
          error.message?.includes('relation "public.characters" does not exist') ||
          error.message?.includes("Could not find the table 'public.characters'");

        if (isTableNotFound) {
          // Não logar erro para tabela não encontrada - é esperado antes da migration
          return { data: [], error: null };
        }

        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: (data as Character[]) || [], error: null };
    } catch (error: any) {
      const isTableNotFound = 
        error?.status === 404 || 
        error?.message?.includes('relation "characters" does not exist') ||
        error?.message?.includes('relation "public.characters" does not exist') ||
        error?.message?.includes("Could not find the table 'public.characters'");

      if (isTableNotFound) {
        // Não logar erro para tabela não encontrada - é esperado antes da migration
        return { data: [], error: null };
      }

      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getDefaultCharacter(userId: string) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      if (error) {
        const isTableNotFound = 
          error.code === 'PGRST116' || 
          error.status === 404 || 
          error.message?.includes('relation "characters" does not exist') ||
          error.message?.includes('relation "public.characters" does not exist') ||
          error.message?.includes("Could not find the table 'public.characters'");

        if (isTableNotFound) {
          // Não logar erro para tabela não encontrada - é esperado antes da migration
          return { data: null, error: null };
        }

        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: (data as Character) || null, error: null };
    } catch (error: any) {
      const isTableNotFound = 
        error?.status === 404 || 
        error?.message?.includes('relation "characters" does not exist') ||
        error?.message?.includes('relation "public.characters" does not exist') ||
        error?.message?.includes("Could not find the table 'public.characters'");

      if (isTableNotFound) {
        // Não logar erro para tabela não encontrada - é esperado antes da migration
        return { data: null, error: null };
      }

      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getCharacter(characterId: string) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();

      if (error) {
        const isTableNotFound = 
          error.status === 404 || 
          error.message?.includes('relation "characters" does not exist') ||
          error.message?.includes('relation "public.characters" does not exist');

        if (isTableNotFound) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela characters não encontrada. Aplique a migration primeiro.');
          }
          return { data: null, error: null };
        }

        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Character, error: null };
    } catch (error: any) {
      const isTableNotFound = 
        error?.status === 404 || 
        error?.message?.includes('relation "characters" does not exist') ||
        error?.message?.includes('relation "public.characters" does not exist') ||
        error?.message?.includes("Could not find the table 'public.characters'");

      if (isTableNotFound) {
        // Não logar erro para tabela não encontrada - é esperado antes da migration
        return { data: null, error: null };
      }

      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async createCharacter(userId: string, character: CreateCharacter) {
    try {
      // Validar com Zod antes de salvar
      const validated = CharacterSchema.omit({ id: true, user_id: true }).parse(character);

      const { data, error } = await supabase
        .from('characters')
        .insert({
          ...validated,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Character, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async updateCharacter(characterId: string, character: UpdateCharacter) {
    try {
      // Validar com Zod antes de atualizar
      const validated = CharacterSchema.partial().parse(character);

      const { data, error } = await supabase
        .from('characters')
        .update(validated)
        .eq('id', characterId)
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Character, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async deleteCharacter(characterId: string) {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);

      if (error) {
        Observability.trackError(error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { error };
    }
  },

  async setDefaultCharacter(characterId: string) {
    try {
      // Primeiro, obter user_id do character
      const { data: character, error: fetchError } = await supabase
        .from('characters')
        .select('user_id')
        .eq('id', characterId)
        .single();

      if (fetchError) {
        return { error: { message: 'Personagem não encontrado' } };
      }

      if (!character) {
        return { error: { message: 'Personagem não encontrado' } };
      }

      // Remover is_default de todos os characters do usuário
      const { error: unsetError } = await supabase
        .from('characters')
        .update({ is_default: false })
        .eq('user_id', character.user_id);

      if (unsetError) {
        Observability.trackError(unsetError);
        return { error: unsetError };
      }

      // Definir este character como padrão
      const { error: setError } = await supabase
        .from('characters')
        .update({ is_default: true })
        .eq('id', characterId);

      if (setError) {
        Observability.trackError(setError);
        return { error: setError };
      }

      return { error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { error };
    }
  },

  async trainCharacter(params: TrainCharacterRequest) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/brand_voice_train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify({
          // Usar characterId se fornecido, senão brandProfileId (compatibilidade)
          characterId: params.characterId,
          brandProfileId: params.characterId, // Fallback para compatibilidade
          name: params.name,
          description: params.description,
          samples: params.samples,
          isDefault: params.isDefault,
          modelProvider: params.modelProvider,
          modelName: params.modelName,
          // 8 Dimensões de personalidade
          personalityCore: params.personalityCore,
          communicationTone: params.communicationTone,
          motivationFocus: params.motivationFocus,
          socialAttitude: params.socialAttitude,
          cognitiveSpeed: params.cognitiveSpeed,
          vocabularyStyle: params.vocabularyStyle,
          emotionalState: params.emotionalState,
          valuesTendencies: params.valuesTendencies,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao treinar personagem' }));
        Observability.trackError(error);
        return { data: null, error };
      }

      const result = await response.json();
      // Retornar character se disponível, senão usar brandProfile
      return { data: (result.character || result.brandProfile) as Character, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async transformWithCharacter(params: TransformWithCharacterRequest) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const characterId = params.characterId?.trim();
      if (!characterId) {
        const error = { message: 'CharacterId ausente na requisição' };
        Observability.trackError(error);
        console.error('[transform] Nenhum characterId disponível', params);
        return { data: null, error };
      }

      const payload: Record<string, any> = {
        characterId,
        inputText: params.inputText,
        transformationType: params.transformationType,
        tone: params.tone,
        length: params.length,
        useSimilaritySearch: params.useSimilaritySearch,
        similarityThreshold: params.similarityThreshold,
        maxSimilarChunks: params.maxSimilarChunks,
        traceId: params.traceId,
        refinementHints: params.refinementHints,
        currentOutput: params.currentOutput,
        isRefresh: params.isRefresh ?? false,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      console.log('transform payload', payload);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/brand_voice_transform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      let parsed: any = null;
      if (rawText) {
        try {
          parsed = JSON.parse(rawText);
        } catch (parseError) {
          parsed = null;
        }
      }

      console.log('transform response', {
        status: response.status,
        data: parsed ?? rawText,
      });

      if (!response.ok) {
        const errorPayload = parsed ?? { error: rawText || `HTTP ${response.status}` };
        const errorMessage = typeof errorPayload === 'object' && errorPayload?.error
          ? errorPayload.error
          : `HTTP ${response.status}`;
        const formattedError = { message: errorMessage, details: errorPayload };
        Observability.trackError(formattedError);
        return { data: null, error: formattedError };
      }

      const transformedText = typeof parsed === 'object' && parsed?.transformedText
        ? parsed.transformedText
        : null;

      if (!transformedText) {
        console.warn('[transform] resposta sem transformedText', parsed);
        return { data: null, error: { message: 'Resposta inválida do servidor' } };
      }

      return { data: transformedText as string, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      console.error('[transform] erro inesperado', error);
      return { data: null, error };
    }
  },

  async listSamples(characterId: string) {
    try {
      const { data, error } = await supabase
        .from('character_samples')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false });

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: (data as CharacterSample[]) || [], error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async addSample(characterId: string, sample: Omit<CharacterSample, 'id' | 'character_id' | 'user_id'>) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      // Validar com Zod
      const validated = CharacterSampleSchema.omit({ id: true, character_id: true, user_id: true }).parse(sample);

      const { data, error } = await supabase
        .from('character_samples')
        .insert({
          ...validated,
          character_id: characterId,
          user_id: session.data.session.user.id,
        })
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as CharacterSample, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async deleteSample(sampleId: string) {
    try {
      const { error } = await supabase
        .from('character_samples')
        .delete()
        .eq('id', sampleId);

      if (error) {
        Observability.trackError(error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { error };
    }
  },
};
