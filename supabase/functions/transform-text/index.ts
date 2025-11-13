import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Build transformation prompt based on character and parameters
function buildPrompt(
  text: string,
  character: any,
  transformationType: string,
  length: string
): string {
  const lengthMap: Record<string, string> = {
    short: '50-100 palavras',
    medium: '150-250 palavras',
    long: '300-500 palavras'
  };

  const typeMap: Record<string, string> = {
    social_post: 'post para redes sociais',
    summary: 'resumo executivo',
    newsletter: 'conteúdo para newsletter',
    script: 'roteiro narrativo',
    custom: 'texto customizado'
  };

  let prompt = `Você é um especialista em criação de conteúdo. Transforme o texto abaixo em ${typeMap[transformationType] || 'conteúdo'} com ${lengthMap[length] || '150-250 palavras'}.\n\n`;

  if (character) {
    prompt += `PERSONAGEM:\n`;
    prompt += `Nome: ${character.name}\n`;
    if (character.description) {
      prompt += `Descrição: ${character.description}\n`;
    }
    
    prompt += `\nCaracterísticas (escala 0-100):\n`;
    prompt += `- Formalidade: ${character.formality}/100\n`;
    prompt += `- Entusiasmo: ${character.enthusiasm}/100\n`;
    prompt += `- Complexidade: ${character.complexity}/100\n`;
    prompt += `- Humor: ${character.humor}/100\n`;
    prompt += `- Empatia: ${character.empathy}/100\n`;
    prompt += `- Objetividade: ${character.directness}/100\n`;
    prompt += `- Criatividade: ${character.creativity}/100\n`;
    prompt += `- Técnico: ${character.technical}/100\n\n`;
    
    if (character.style_examples && character.style_examples.length > 0) {
      prompt += `Exemplos de estilo:\n`;
      character.style_examples.forEach((example: string, i: number) => {
        prompt += `${i + 1}. ${example}\n`;
      });
      prompt += `\n`;
    }
  }

  prompt += `TEXTO ORIGINAL:\n${text}\n\n`;
  prompt += `INSTRUÇÕES:\n`;
  prompt += `- Mantenha a essência e o tom do personagem descrito\n`;
  prompt += `- Use linguagem clara e envolvente\n`;
  prompt += `- Adapte ao formato ${typeMap[transformationType] || 'solicitado'}\n`;
  prompt += `- Mantenha o tamanho solicitado: ${lengthMap[length] || '150-250 palavras'}\n`;

  return prompt;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    const {
      original_text,
      character_id,
      transcription_id,
      transformation_type,
      transformation_length,
      cost_dracmas = 10
    } = await req.json();

    if (!original_text || !transformation_type) {
      throw new Error('Missing required fields: original_text, transformation_type');
    }

    console.log('Starting transformation:', {
      transformation_type,
      transformation_length: transformation_length || 'medium',
      character_id
    });

    const startTime = Date.now();

    // Get character if provided
    let character = null;
    if (character_id) {
      const { data: charData } = await supabaseClient
        .from('characters')
        .select('*')
        .eq('id', character_id)
        .single();
      
      character = charData;
      console.log('Character loaded:', character?.name);
    }

    // Build prompt
    const prompt = buildPrompt(
      original_text,
      character,
      transformation_type,
      transformation_length || 'medium'
    );

    console.log('Calling GPT API...');

    // Call OpenAI GPT API
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em criação de conteúdo e transformação de texto. Mantenha sempre o tom e personalidade solicitados.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text();
      console.error('GPT API error:', errorText);
      throw new Error(`GPT API error: ${errorText}`);
    }

    const gptResult = await gptResponse.json();
    const transformedText = gptResult.choices[0].message.content;
    console.log('GPT API response received');

    const processingTime = Date.now() - startTime;

    // Save to transcription_history
    const { data: historyData, error: historyError } = await supabaseClient
      .from('transcription_history')
      .insert({
        user_id: user.id,
        transcription_id: transcription_id || null,
        character_id: character_id || null,
        original_text,
        transformed_text: transformedText,
        transformation_type,
        transformation_length: transformation_length || 'medium',
        cost_dracmas,
        processing_time_ms: processingTime,
        metadata: {
          model: 'gpt-4o-mini',
          prompt_tokens: gptResult.usage?.prompt_tokens,
          completion_tokens: gptResult.usage?.completion_tokens
        }
      })
      .select()
      .single();

    if (historyError) {
      console.error('Error saving history:', historyError);
      throw historyError;
    }

    console.log('History saved:', historyData.id);

    // Log transformation event
    await supabaseClient
      .from('transformation_events')
      .insert({
        history_id: historyData.id,
        user_id: user.id,
        event_type: 'completed',
        event_data: {
          transformation_type,
          character_name: character?.name,
          text_length: transformedText.length
        },
        processing_time_ms: processingTime
      });

    // Get current balance
    const { data: lastTransaction } = await supabaseClient
      .from('credits_ledger')
      .select('balance_after')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentBalance = lastTransaction?.balance_after || 0;
    const newBalance = Math.max(0, currentBalance - cost_dracmas);

    // Debit credits
    await supabaseClient
      .from('credits_ledger')
      .insert({
        user_id: user.id,
        transaction_type: 'debit',
        amount: cost_dracmas,
        balance_after: newBalance,
        reference_type: 'transformation',
        reference_id: historyData.id,
        reason: `Transformação: ${transformation_type}`,
        metadata: {
          transformation_type,
          character_id
        }
      });

    // Create notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'transformation_complete',
        title: 'Transformação Concluída',
        message: `Seu conteúdo foi transformado com sucesso. Debitado ${cost_dracmas} dracmas. Saldo: ${newBalance}`,
        reference_type: 'transformation',
        reference_id: historyData.id,
        data: {
          cost_dracmas,
          new_balance: newBalance,
          transformation_type
        }
      });

    // Check if credits are low
    if (newBalance < 50 && newBalance >= 0) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'credits_low',
          title: 'Créditos Baixos',
          message: `Você tem apenas ${newBalance} dracmas restantes. Considere adicionar mais créditos.`,
          data: { balance: newBalance }
        });
    }

    console.log('Transformation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        history_id: historyData.id,
        transformed_text: transformedText,
        cost_dracmas,
        new_balance: newBalance,
        processing_time_ms: processingTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in transform-text function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
