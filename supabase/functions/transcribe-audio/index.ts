import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
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

    const { transcription_id, asset_id, audio_data } = await req.json();
    
    if (!transcription_id || !asset_id || !audio_data) {
      throw new Error('Missing required fields: transcription_id, asset_id, audio_data');
    }

    console.log('Starting transcription for:', transcription_id);
    const startTime = Date.now();

    // Update transcription status to processing
    await supabaseClient
      .from('transcriptions')
      .update({ status: 'processing' })
      .eq('id', transcription_id);

    // Log transcription event
    await supabaseClient
      .from('transcription_events')
      .insert({
        transcription_id,
        user_id: user.id,
        event_type: 'processing_started',
        event_data: { asset_id }
      });

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio_data);
    console.log('Audio processed, size:', binaryAudio.length);
    
    // Prepare form data for Whisper API
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    // Send to OpenAI Whisper API
    console.log('Calling Whisper API...');
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', errorText);
      throw new Error(`Whisper API error: ${errorText}`);
    }

    const whisperResult = await whisperResponse.json();
    console.log('Whisper API response received');

    const processingTime = Date.now() - startTime;

    // Update transcription with result
    const { error: updateError } = await supabaseClient
      .from('transcriptions')
      .update({
        status: 'completed',
        text: whisperResult.text,
        language: whisperResult.language,
        processing_time_ms: processingTime,
        metadata: {
          duration: whisperResult.duration,
          segments: whisperResult.segments?.length || 0
        }
      })
      .eq('id', transcription_id);

    if (updateError) {
      console.error('Error updating transcription:', updateError);
      throw updateError;
    }

    // Log completion event
    await supabaseClient
      .from('transcription_events')
      .insert({
        transcription_id,
        user_id: user.id,
        event_type: 'completed',
        event_data: {
          processing_time_ms: processingTime,
          text_length: whisperResult.text.length,
          language: whisperResult.language
        },
        processing_time_ms: processingTime
      });

    // Create notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'transcription_complete',
        title: 'Transcrição Concluída',
        message: `Sua transcrição foi concluída com sucesso em ${(processingTime / 1000).toFixed(1)}s`,
        reference_type: 'transcription',
        reference_id: transcription_id,
        data: { asset_id }
      });

    console.log('Transcription completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        transcription_id,
        text: whisperResult.text,
        language: whisperResult.language,
        processing_time_ms: processingTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in transcribe-audio function:', error);
    
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
