#!/usr/bin/env tsx
/**
 * Script de teste para verificar se as Edge Functions de Brand Voice estão funcionando
 * 
 * Uso:
 *   tsx scripts/test-brand-voice-functions.ts
 * 
 * Requer:
 *   - Variável de ambiente VITE_SUPABASE_URL
 *   - Token de autenticação (será solicitado)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://giozhrukzcqoopssegby.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não encontrada no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function testCORS() {
  console.log('\n🔍 Testando CORS (OPTIONS request)...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/brand_voice_train`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8081',
      },
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   CORS Headers:`, {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
    });

    if (response.status === 204 || response.status === 200) {
      console.log('   ✅ CORS configurado corretamente');
      return true;
    } else {
      console.log('   ⚠️ CORS pode ter problemas');
      return false;
    }
  } catch (error: any) {
    console.error('   ❌ Erro ao testar CORS:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testando autenticação...');
  
  const email = await question('   Email: ');
  const password = await question('   Senha: ');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    console.error('   ❌ Erro ao autenticar:', error?.message);
    return null;
  }

  console.log('   ✅ Autenticado com sucesso');
  return data.session.access_token;
}

async function testBrandVoiceTrain(token: string) {
  console.log('\n🧪 Testando brand_voice_train...');

  const testData = {
    name: 'Teste de Voz',
    description: 'Voz de teste criada pelo script',
    samples: [
      'Este é um exemplo de texto para treinar a voz da marca. Deve ser claro e objetivo.',
      'Outro exemplo de texto que demonstra o estilo de comunicação desejado.',
      'Terceiro exemplo para garantir que há variedade suficiente nos samples.',
    ],
    isDefault: false,
    modelProvider: 'openai' as const,
    modelName: 'gpt-4o',
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/brand_voice_train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(testData),
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.error('   ❌ Erro na resposta:', responseText);
      return false;
    }

    try {
      const result = JSON.parse(responseText);
      console.log('   ✅ Função executada com sucesso!');
      console.log(`   📊 Resultado:`, {
        profileId: result.brandProfile?.id,
        samplesProcessed: result.stats?.samplesProcessed,
        embeddingsCreated: result.stats?.embeddingsCreated,
        trainingTimeMs: result.stats?.trainingTimeMs,
      });
      return true;
    } catch (parseError) {
      console.error('   ❌ Erro ao parsear resposta:', parseError);
      console.log('   Resposta bruta:', responseText);
      return false;
    }
  } catch (error: any) {
    console.error('   ❌ Erro ao chamar função:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Teste de Edge Functions - Brand Voice\n');
  console.log(`📍 URL: ${SUPABASE_URL}`);

  // Teste 1: CORS
  const corsOk = await testCORS();

  // Teste 2: Autenticação
  const token = await testAuthentication();
  if (!token) {
    console.log('\n❌ Não foi possível autenticar. Encerrando testes.');
    rl.close();
    process.exit(1);
  }

  // Teste 3: Brand Voice Train
  const trainOk = await testBrandVoiceTrain(token);

  // Resumo
  console.log('\n📋 Resumo dos Testes:');
  console.log(`   CORS: ${corsOk ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`   Autenticação: ✅ OK`);
  console.log(`   Brand Voice Train: ${trainOk ? '✅ OK' : '❌ FALHOU'}`);

  if (corsOk && trainOk) {
    console.log('\n🎉 Todos os testes passaram! As funções estão funcionando corretamente.');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
  }

  rl.close();
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  rl.close();
  process.exit(1);
});

