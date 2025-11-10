#!/usr/bin/env node
/**
 * Script para verificar e aplicar migration da tabela brand_profiles
 * 
 * Uso:
 *   npm run verify:brand-voice  - Apenas verifica se a tabela existe
 *   npm run migrate:brand-voice - Verifica e aplica migration se necessário
 * 
 * Requer:
 *   - SUPABASE_ACCESS_TOKEN (para autenticação)
 *   - Projeto Supabase linkado (supabase link) ou SUPABASE_PROJECT_REF
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Tabelas que devem existir após a migration
const REQUIRED_TABLES = ['brand_profiles', 'brand_samples', 'brand_embeddings'];
const MIGRATION_FILE = join(PROJECT_ROOT, 'supabase/migrations/20250115000001_create_brand_voice_tables.sql');

interface TableStatus {
  name: string;
  exists: boolean;
}

interface VerificationResult {
  tables: TableStatus[];
  allExist: boolean;
  migrationNeeded: boolean;
}

/**
 * Verifica se o Supabase CLI está instalado
 */
function checkSupabaseCLI(): boolean {
  try {
    execSync('supabase --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica se as tabelas existem usando query SQL via Supabase CLI
 */
async function checkTablesExist(): Promise<VerificationResult> {
  // Verificar se CLI está disponível
  if (!checkSupabaseCLI()) {
    console.log('⚠️  Supabase CLI não encontrado. Usando método alternativo...\n');
    return await checkTablesExistAlternative();
  }

  const checkSQL = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (${REQUIRED_TABLES.map(t => `'${t}'`).join(', ')}) ORDER BY table_name;`;

  try {
    // Tentar executar query via Supabase CLI
    // Nota: Pode não funcionar se projeto não estiver linkado
    const result = execSync(
      `supabase db execute --sql "${checkSQL.replace(/"/g, '\\"')}"`,
      { 
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    // Parse do resultado (formato pode variar)
    const existingTables = new Set<string>();
    const lines = result.trim().split('\n');
    
    // Processar linhas (pode ter header ou não)
    for (const line of lines) {
      const trimmed = line.trim();
      // Procurar por nomes de tabelas na linha
      for (const tableName of REQUIRED_TABLES) {
        if (trimmed.includes(tableName)) {
          existingTables.add(tableName);
        }
      }
    }

    const tables: TableStatus[] = REQUIRED_TABLES.map(name => ({
      name,
      exists: existingTables.has(name)
    }));

    const allExist = tables.every(t => t.exists);
    
    return {
      tables,
      allExist,
      migrationNeeded: !allExist
    };
  } catch (error: any) {
    // Se o comando falhar, tentar método alternativo
    console.warn('⚠️  Não foi possível verificar via CLI. Tentando método alternativo...\n');
    return await checkTablesExistAlternative();
  }
}

/**
 * Método alternativo: verifica via query direta usando Supabase client
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */
async function checkTablesExistAlternative(): Promise<VerificationResult> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Para verificação alternativa, defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.\n' +
        'Ou configure o Supabase CLI com: supabase link --project-ref <project-ref>'
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verificar cada tabela tentando fazer uma query simples
    const tables: TableStatus[] = [];

    for (const tableName of REQUIRED_TABLES) {
      try {
        const { error } = await adminClient
          .from(tableName)
          .select('id')
          .limit(1);

        const exists = !error || !(
          error.code === 'PGRST116' ||
          error.message?.includes('relation') && error.message?.includes('does not exist')
        );

        tables.push({ name: tableName, exists });
      } catch {
        tables.push({ name: tableName, exists: false });
      }
    }

    const allExist = tables.every(t => t.exists);

    return {
      tables,
      allExist,
      migrationNeeded: !allExist
    };
  } catch (error: any) {
    console.error('Erro na verificação alternativa:', error.message);
    // Retornar resultado com todas as tabelas como não existentes
    return {
      tables: REQUIRED_TABLES.map(name => ({ name, exists: false })),
      allExist: false,
      migrationNeeded: true
    };
  }
}

/**
 * Aplica a migration usando Supabase CLI
 */
function applyMigration(): void {
  if (!checkSupabaseCLI()) {
    throw new Error(
      'Supabase CLI não encontrado. Instale com: npm install -g supabase\n' +
      'Ou use o método manual via Dashboard conforme documentação.'
    );
  }

  console.log('📄 Verificando arquivo de migration...');
  
  if (!existsSync(MIGRATION_FILE)) {
    throw new Error(`Arquivo de migration não encontrado: ${MIGRATION_FILE}`);
  }

  console.log('🚀 Aplicando migration via Supabase CLI...');
  console.log('   (Usando: supabase db push)\n');
  
  try {
    // Usar db push que aplica todas as migrations pendentes
    execSync(
      'supabase db push',
      {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      }
    );
    
    console.log('\n✅ Migration aplicada com sucesso!');
  } catch (error: any) {
    console.error('\n❌ Erro ao aplicar migration:', error.message);
    console.error('\n💡 Alternativa: Execute manualmente via Dashboard:');
    console.error(`   1. Acesse https://app.supabase.com`);
    console.error(`   2. Vá em SQL Editor`);
    console.error(`   3. Cole o conteúdo de: ${MIGRATION_FILE}`);
    throw error;
  }
}

/**
 * Aplica migration usando método alternativo (service role)
 */
async function applyMigrationAlternative(): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Para aplicar migration, defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Ou use o Supabase CLI: supabase db push'
    );
  }

  console.log('📄 Lendo arquivo de migration...');
  const migrationSQL = readFileSync(MIGRATION_FILE, 'utf-8');

  console.log('⚠️  Método alternativo: Execute a migration manualmente via Dashboard:\n');
  console.log('1. Acesse https://app.supabase.com');
  console.log('2. Vá em SQL Editor');
  console.log('3. Cole o conteúdo do arquivo:', MIGRATION_FILE);
  console.log('\nOu use o Supabase CLI: supabase db push');
  
  // Nota: Não podemos executar SQL arbitrário via PostgREST
  // O usuário precisa usar o Dashboard ou CLI
}

/**
 * Função principal de verificação
 */
export async function verifyBrandVoiceTables(): Promise<VerificationResult> {
  console.log('🔍 Verificando tabelas do Brand Voice...\n');
  
  const result = await checkTablesExist();
  
  console.log('📊 Status das tabelas:');
  result.tables.forEach(({ name, exists }) => {
    const icon = exists ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${exists ? 'existe' : 'não existe'}`);
  });
  
  console.log();
  
  if (result.allExist) {
    console.log('✅ Todas as tabelas necessárias existem!');
  } else {
    console.log('⚠️  Algumas tabelas estão faltando.');
    console.log('   Execute: npm run migrate:brand-voice');
  }
  
  return result;
}

/**
 * Função principal de migração
 */
export async function migrateBrandVoice(): Promise<void> {
  console.log('🔍 Verificando estado atual...\n');
  
  const result = await verifyBrandVoiceTables();
  
  if (result.allExist) {
    console.log('\n✅ Migration não necessária. Todas as tabelas já existem.');
    return;
  }
  
  console.log('\n🚀 Aplicando migration...\n');
  
  try {
    if (checkSupabaseCLI()) {
      applyMigration();
    } else {
      await applyMigrationAlternative();
    }
    
    console.log('\n🔍 Verificando novamente após migration...\n');
    const verifyResult = await verifyBrandVoiceTables();
    
    if (verifyResult.allExist) {
      console.log('\n✅ Migration aplicada com sucesso!');
      console.log('📝 Próximo passo: Execute npm run types:generate para regenerar tipos TypeScript');
    } else {
      console.log('\n⚠️  Migration aplicada, mas algumas tabelas ainda não foram detectadas.');
      console.log('   Isso pode ser normal se a verificação ocorreu muito rápido.');
      console.log('   Aguarde alguns segundos e execute: npm run verify:brand-voice');
    }
  } catch (error: any) {
    console.error('\n❌ Erro durante migration:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'verify';
  
  if (command === 'verify') {
    verifyBrandVoiceTables().catch(error => {
      console.error('Erro:', error);
      process.exit(1);
    });
  } else if (command === 'migrate') {
    migrateBrandVoice().catch(error => {
      console.error('Erro:', error);
      process.exit(1);
    });
  } else {
    console.error('Uso: verify-and-apply-brand-voice-migration.ts [verify|migrate]');
    process.exit(1);
  }
}

