// Service para gerenciar assets (arquivos de mídia)
// Integra com Supabase Storage para upload/download
import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

export type AssetType = 'text' | 'audio' | 'video';
export type AssetStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export interface Asset {
  id: string;
  project_id: string;
  user_id: string;
  storage_path: string;
  type: AssetType;
  size_bytes: number;
  duration_seconds: number | null;
  mimetype: string | null;
  status: AssetStatus;
  created_at: string;
}

export interface CreateSignedUploadUrlParams {
  projectId: string;
  type: AssetType;
  filename: string;
  mimetype?: string;
  sizeBytes?: number;
}

export interface UploadFileParams {
  projectId: string;
  type: AssetType;
  file: File;
  onProgress?: (progress: number) => void;
}

export interface AssetsService {
  createSignedUploadUrl: (params: CreateSignedUploadUrlParams) => Promise<{ data: { url: string; path: string; expiresAt: number } | null; error: any }>;
  uploadFile: (params: UploadFileParams) => Promise<{ data: Asset | null; error: any }>;
  listAssets: (projectId: string) => Promise<{ data: Asset[] | null; error: any }>;
  getAsset: (id: string) => Promise<{ data: Asset | null; error: any }>;
  updateAssetStatus: (id: string, status: AssetStatus, metadata?: { duration_seconds?: number; mimetype?: string }) => Promise<{ data: Asset | null; error: any }>;
  deleteAsset: (id: string) => Promise<{ error: any }>;
  getSignedDownloadUrl: (storagePath: string, expiresIn?: number) => Promise<{ data: { url: string } | null; error: any }>;
}

// Mapeamento de tipo para bucket
function getBucketForType(type: AssetType): string {
  switch (type) {
    case 'text':
      return 'text';
    case 'audio':
      return 'audio';
    case 'video':
      return 'video';
    default:
      throw new Error(`Tipo de asset inválido: ${type}`);
  }
}

// Validações
function validateFileSize(sizeBytes: number, type: AssetType): { valid: boolean; error?: string } {
  const limits: Record<AssetType, number> = {
    text: 2 * 1024 * 1024, // 2MB
    audio: 200 * 1024 * 1024, // 200MB
    video: 2 * 1024 * 1024 * 1024, // 2GB
  };

  if (sizeBytes > limits[type]) {
    return { valid: false, error: `Arquivo muito grande. Limite para ${type}: ${limits[type] / (1024 * 1024)}MB` };
  }

  return { valid: true };
}

function normalizeFileForUpload(file: File, type: AssetType): File {
  if (type !== 'audio') {
    return file;
  }

  if (file.type === 'video/webm') {
    const normalizedName = file.name.toLowerCase().endsWith('.webm') ? file.name : `${file.name}.webm`;
    return new File([file], normalizedName, { type: 'audio/webm' });
  }

  if (file.type === 'video/mp4') {
    const normalizedName = file.name.toLowerCase().endsWith('.mp4') ? file.name : `${file.name}.mp4`;
    return new File([file], normalizedName, { type: 'audio/mp4' });
  }

  return file;
}

export const assetsService: AssetsService = {
  async uploadFile(params) {
    try {
      const { projectId, type, file, onProgress } = params;

      const uploadableFile = normalizeFileForUpload(file, type);

      // Validações
      const sizeValidation = validateFileSize(uploadableFile.size, type);
      if (!sizeValidation.valid) {
        return { data: null, error: { message: sizeValidation.error } };
      }

      const bucket = getBucketForType(type);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const path = `${userId}/${projectId}/${Date.now()}-${uploadableFile.name}`;

      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .insert({
          project_id: projectId,
          user_id: userId,
          storage_path: path,
          type: type,
          size_bytes: uploadableFile.size,
          mimetype: uploadableFile.type || null,
          status: 'uploading',
        })
        .select()
        .single();

      if (assetError) {
        Observability.trackError(assetError);
        return { data: null, error: assetError };
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, uploadableFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: uploadableFile.type || undefined,
          onUploadProgress: (progress) => {
            if (onProgress) {
              const percent = (progress.loaded / progress.total) * 100;
              onProgress(percent);
            }
          },
        });

      if (uploadError) {
        await supabase.from('assets').delete().eq('id', assetData.id);
        Observability.trackError(uploadError);
        return { data: null, error: uploadError };
      }

      const { data: updatedAsset, error: updateError } = await supabase
        .from('assets')
        .update({ status: 'ready', mimetype: uploadableFile.type || null, size_bytes: uploadableFile.size })
        .eq('id', assetData.id)
        .select()
        .single();

      if (updateError) {
        Observability.trackError(updateError);
        return { data: assetData as Asset, error: null };
      }

      return { data: updatedAsset as Asset, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async createSignedUploadUrl(params) {
    try {
      // Validações
      if (params.sizeBytes) {
        const sizeValidation = validateFileSize(params.sizeBytes, params.type);
        if (!sizeValidation.valid) {
          return { data: null, error: { message: sizeValidation.error } };
        }
      }

      const bucket = getBucketForType(params.type);
      const path = `${params.projectId}/${Date.now()}-${params.filename}`;

      // Criar signed URL para upload
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(path, {
          upsert: false,
        });

      if (signedError) {
        Observability.trackError(signedError);
        return { data: null, error: signedError };
      }

      // Criar registro de asset no banco (status: uploading)
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .insert({
          project_id: params.projectId,
          storage_path: path,
          type: params.type,
          size_bytes: params.sizeBytes || 0,
          mimetype: params.mimetype || null,
          status: 'uploading',
        })
        .select()
        .single();

      if (assetError) {
        Observability.trackError(assetError);
        return { data: null, error: assetError };
      }

      return {
        data: {
          url: signedData.signedUrl,
          path: signedData.path,
          expiresAt: signedData.expiresIn ? Date.now() + signedData.expiresIn * 1000 : Date.now() + 3600000,
        },
        error: null,
      };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async listAssets(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Asset[], error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getAsset(id: string) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Asset, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async updateAssetStatus(id: string, status: AssetStatus, metadata?: { duration_seconds?: number; mimetype?: string }) {
    try {
      const updates: Record<string, any> = { status };

      if (metadata?.duration_seconds !== undefined) {
        updates.duration_seconds = metadata.duration_seconds;
      }

      if (metadata?.mimetype !== undefined) {
        updates.mimetype = metadata.mimetype;
      }

      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Asset, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async deleteAsset(id: string) {
    try {
      // Obter asset para deletar do storage também
      const { data: asset, error: fetchError } = await this.getAsset(id);
      if (fetchError || !asset) {
        return { error: fetchError || { message: 'Asset não encontrado' } };
      }

      // Deletar do storage
      const bucket = getBucketForType(asset.type);
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([asset.storage_path]);

      if (storageError) {
        Observability.trackError(storageError);
        // Continuar mesmo se falhar no storage (pode já estar deletado)
      }

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (dbError) {
        Observability.trackError(dbError);
        return { error: dbError };
      }

      return { error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { error };
    }
  },

  async getSignedDownloadUrl(storagePath: string, expiresIn: number = 3600) {
    try {
      // Determinar bucket pelo path (assumindo estrutura: projectId/timestamp-filename)
      // Em produção, seria melhor armazenar o tipo no asset
      const pathParts = storagePath.split('/');
      if (pathParts.length < 2) {
        return { data: null, error: { message: 'Caminho de storage inválido' } };
      }

      // Tentar cada bucket (não ideal, mas funcional)
      const buckets = ['text', 'audio', 'video'];
      for (const bucket of buckets) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(storagePath, expiresIn);

        if (!error && data) {
          return { data: { url: data.signedUrl }, error: null };
        }
      }

      return { data: null, error: { message: 'Arquivo não encontrado em nenhum bucket' } };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },
};

