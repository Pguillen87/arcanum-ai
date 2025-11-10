// Hook para gerenciar projetos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService, type Project, type CreateProjectParams } from '@/services/projectsService';
import { useToast } from '@/hooks/use-toast';

export function useProjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const { data, error } = await projectsService.listProjects();
        if (error) {
          console.error('[useProjects] Erro ao listar projetos:', error);
          return []; // Retornar array vazio em vez de lançar erro
        }
        return data || [];
      } catch (err) {
        console.error('[useProjects] Erro inesperado:', err);
        return []; // Fallback seguro
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const createProject = useMutation({
    mutationFn: async (params: CreateProjectParams) => {
      const { data, error } = await projectsService.createProject(params);
      if (error) throw error;
      if (!data) throw new Error('Projeto não foi criado');
      return data;
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData<Project[]>(['projects'], (old) => {
        return old ? [newProject, ...old] : [newProject];
      });
      toast({
        title: 'Projeto criado!',
        description: `"${newProject.name}" foi criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar projeto',
        description: error.message || 'Não foi possível criar o projeto',
        variant: 'destructive',
      });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, params }: { id: string; params: Partial<CreateProjectParams> }) => {
      const { data, error } = await projectsService.updateProject(id, params);
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<Project[]>(['projects'], (old) => {
        return old?.map((p) => (p.id === updatedProject.id ? updatedProject : p)) || [];
      });
      toast({
        title: 'Projeto atualizado!',
        description: 'Suas alterações foram salvas.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar projeto',
        description: error.message || 'Não foi possível atualizar o projeto',
        variant: 'destructive',
      });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await projectsService.deleteProject(id);
      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Project[]>(['projects'], (old) => {
        return old?.filter((p) => p.id !== deletedId) || [];
      });
      toast({
        title: 'Projeto deletado',
        description: 'O projeto foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar projeto',
        description: error.message || 'Não foi possível deletar o projeto',
        variant: 'destructive',
      });
    },
  });

  return {
    projects: projects || [],
    isLoading,
    error,
    createProject: createProject.mutateAsync,
    updateProject: updateProject.mutate,
    deleteProject: deleteProject.mutate,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isDeleting: deleteProject.isPending,
  };
}

export function useProject(id: string | null) {
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const { data, error } = await projectsService.getProject(id);
        if (error) {
          console.error('[useProject] Erro ao obter projeto:', error);
          return null;
        }
        return data;
      } catch (err) {
        console.error('[useProject] Erro inesperado:', err);
        return null;
      }
    },
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    project,
    isLoading,
    error,
  };
}

