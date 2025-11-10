// Service para gerenciar projetos
// Projetos agrupam assets e transformations logicamente
import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      Observability.trackError(error);
      return null;
    }
    return data.user ?? null;
  } catch (error) {
    Observability.trackError(error);
    return null;
  }
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectParams {
  name: string;
  description?: string;
}

export interface ProjectsService {
  createProject: (params: CreateProjectParams) => Promise<{ data: Project | null; error: any }>;
  listProjects: () => Promise<{ data: Project[] | null; error: any }>;
  getProject: (id: string) => Promise<{ data: Project | null; error: any }>;
  updateProject: (id: string, params: Partial<CreateProjectParams>) => Promise<{ data: Project | null; error: any }>;
  deleteProject: (id: string) => Promise<{ error: any }>;
}

// Validações
function validateProjectName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Nome do projeto não pode estar vazio' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Nome do projeto deve ter no máximo 100 caracteres' };
  }
  return { valid: true };
}

function validateDescription(description?: string): { valid: boolean; error?: string } {
  if (description && description.length > 500) {
    return { valid: false, error: 'Descrição deve ter no máximo 500 caracteres' };
  }
  return { valid: true };
}

export const projectsService: ProjectsService = {
  async createProject(params) {
    try {
      // Validações
      const nameValidation = validateProjectName(params.name);
      if (!nameValidation.valid) {
        return { data: null, error: { message: nameValidation.error } };
      }

      const descValidation = validateDescription(params.description);
      if (!descValidation.valid) {
        return { data: null, error: { message: descValidation.error } };
      }

      const user = await getCurrentUser();
      if (!user) {
        const error = { message: 'Usuário não autenticado' };
        Observability.trackError(error);
        return { data: null, error };
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: params.name.trim(),
          description: params.description?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Project, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async listProjects() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        const error = { message: 'Usuário não autenticado' };
        Observability.trackError(error);
        return { data: null, error };
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Project[], error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getProject(id: string) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        const error = { message: 'Usuário não autenticado' };
        Observability.trackError(error);
        return { data: null, error };
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Project, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async updateProject(id: string, params: Partial<CreateProjectParams>) {
    try {
      const updates: Record<string, any> = {};

      if (params.name !== undefined) {
        const nameValidation = validateProjectName(params.name);
        if (!nameValidation.valid) {
          return { data: null, error: { message: nameValidation.error } };
        }
        updates.name = params.name.trim();
      }

      if (params.description !== undefined) {
        const descValidation = validateDescription(params.description);
        if (!descValidation.valid) {
          return { data: null, error: { message: descValidation.error } };
        }
        updates.description = params.description?.trim() || null;
      }

      if (Object.keys(updates).length === 0) {
        return { data: null, error: { message: 'Nenhuma alteração fornecida' } };
      }

      const user = await getCurrentUser();
      if (!user) {
        const error = { message: 'Usuário não autenticado' };
        Observability.trackError(error);
        return { data: null, error };
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Project, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async deleteProject(id: string) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        const error = { message: 'Usuário não autenticado' };
        Observability.trackError(error);
        return { error };
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

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

