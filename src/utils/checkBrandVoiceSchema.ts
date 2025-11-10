// Utilitário para verificar se as tabelas do Brand Voice existem no banco
import { supabase } from '@/integrations/supabase/client';

export type SchemaStatus = 'ready' | 'migration_required' | 'error';

export interface TableStatus {
  name: string;
  exists: boolean;
}

export interface DetailedSchemaStatus {
  status: SchemaStatus;
  tables: TableStatus[];
  allTablesExist: boolean;
}

// Cache do resultado para evitar múltiplas verificações
let cachedStatus: SchemaStatus | null = null;
let cachedDetailedStatus: DetailedSchemaStatus | null = null;
let checkPromise: Promise<SchemaStatus> | null = null;
let detailedCheckPromise: Promise<DetailedSchemaStatus> | null = null;

// Tabelas que devem existir após a migration
const REQUIRED_TABLES = ['brand_profiles', 'brand_samples', 'brand_embeddings'] as const;

/**
 * Verifica se as tabelas do Brand Voice existem no banco de dados usando information_schema
 * Método mais robusto que verifica todas as tabelas necessárias
 * @returns Status detalhado com informações sobre cada tabela
 */
export async function checkBrandVoiceSchemaDetailed(): Promise<DetailedSchemaStatus> {
  // Retornar cache se disponível
  if (cachedDetailedStatus !== null) {
    return cachedDetailedStatus;
  }

  // Se já há uma verificação em andamento, aguardar ela
  if (detailedCheckPromise) {
    return detailedCheckPromise;
  }

  // Criar nova verificação
  detailedCheckPromise = (async () => {
    try {
      // Usar RPC para verificar via information_schema (mais confiável)
      // Como não temos RPC específica, vamos verificar cada tabela individualmente
      const tables: TableStatus[] = [];

      for (const tableName of REQUIRED_TABLES) {
        try {
          // Tentar fazer uma query simples na tabela
          // Se a tabela não existir, retornará erro específico
          const { error } = await supabase
            .from(tableName)
            .select('id')
            .limit(1);

          const exists = !error || !(
            error.code === 'PGRST116' ||
            error.status === 404 ||
            error.message?.includes(`relation "${tableName}" does not exist`) ||
            error.message?.includes(`relation "public.${tableName}" does not exist`)
          );

          tables.push({ name: tableName, exists });
        } catch (error: any) {
          // Em caso de erro na verificação, assumir que não existe
          const isTableNotFound = 
            error?.status === 404 ||
            error?.message?.includes(`relation "${tableName}" does not exist`) ||
            error?.message?.includes(`relation "public.${tableName}" does not exist`);

          tables.push({ 
            name: tableName, 
            exists: !isTableNotFound 
          });
        }
      }

      const allTablesExist = tables.every(t => t.exists);
      const status: SchemaStatus = allTablesExist ? 'ready' : 'migration_required';

      const result: DetailedSchemaStatus = {
        status,
        tables,
        allTablesExist
      };

      cachedDetailedStatus = result;
      cachedStatus = status; // Atualizar cache simples também
      
      return result;
    } catch (error: any) {
      // Erro geral na verificação
      const result: DetailedSchemaStatus = {
        status: 'error',
        tables: REQUIRED_TABLES.map(name => ({ name, exists: false })),
        allTablesExist: false
      };
      
      cachedDetailedStatus = result;
      cachedStatus = 'error';
      
      return result;
    } finally {
      // Limpar promise após completar
      detailedCheckPromise = null;
    }
  })();

  return detailedCheckPromise;
}

/**
 * Verifica se as tabelas do Brand Voice existem no banco de dados
 * Versão simplificada que retorna apenas o status
 * @returns Status do schema: 'ready' se tabelas existem, 'migration_required' se não existem, 'error' se houve erro na verificação
 */
export async function checkBrandVoiceSchema(): Promise<SchemaStatus> {
  // Retornar cache se disponível
  if (cachedStatus !== null) {
    return cachedStatus;
  }

  // Se já há uma verificação em andamento, aguardar ela
  if (checkPromise) {
    return checkPromise;
  }

  // Criar nova verificação usando a versão detalhada
  checkPromise = (async () => {
    const detailed = await checkBrandVoiceSchemaDetailed();
    return detailed.status;
  })();

  return checkPromise;
}

/**
 * Limpa o cache do status (útil para forçar nova verificação após aplicar migration)
 */
export function clearSchemaCache(): void {
  cachedStatus = null;
  cachedDetailedStatus = null;
  checkPromise = null;
  detailedCheckPromise = null;
}

