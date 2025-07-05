
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';

interface WordCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useWordCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['wordCategories'],
    queryFn: async (): Promise<WordCategory[]> => {
      logger.info('🔍 Buscando categorias de palavras...', {}, 'USE_WORD_CATEGORIES');
      
      const { data, error } = await supabase
        .from('word_categories')
        .select('id, name, description, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('❌ Erro ao buscar categorias:', { error }, 'USE_WORD_CATEGORIES');
        throw error;
      }

      logger.debug('📋 Categorias encontradas:', { count: data?.length }, 'USE_WORD_CATEGORIES');
      return data || [];
    },
  });

  const createCategory = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const normalizedName = name.toLowerCase().trim();
      
      // Verificar se já existe uma categoria com esse nome
      const { data: existingCategory } = await supabase
        .from('word_categories')
        .select('id, name')
        .eq('name', normalizedName)
        .eq('is_active', true)
        .single();

      if (existingCategory) {
        throw new Error(`Já existe uma categoria com o nome "${name}"`);
      }

      const { data, error } = await supabase
        .from('word_categories')
        .insert({
          name: normalizedName,
          description: description || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Categoria criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['wordCategories'] });
    },
    onError: (error: any) => {
      logger.error('❌ Erro ao criar categoria:', { error }, 'USE_WORD_CATEGORIES');
      
      let errorMessage = "Erro ao criar categoria";
      
      if (error.message && error.message.includes('Já existe uma categoria')) {
        errorMessage = error.message;
      } else if (error.code === '23505') {
        errorMessage = "Já existe uma categoria com este nome";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      const { data, error } = await supabase
        .from('word_categories')
        .update({
          name: name.toLowerCase().trim(),
          description: description || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Categoria atualizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['wordCategories'] });
    },
    onError: (error: any) => {
      logger.error('❌ Erro ao atualizar categoria:', { error }, 'USE_WORD_CATEGORIES');
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria",
        variant: "destructive",
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // Verificar se o usuário é admin através da função do banco
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      
      if (adminError || !isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem excluir categorias');
      }

      const { data, error } = await supabase
        .from('word_categories')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Categoria removida com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['wordCategories'] });
    },
    onError: (error: any) => {
      logger.error('❌ Erro ao remover categoria:', { error }, 'USE_WORD_CATEGORIES');
      
      let errorMessage = "Erro ao remover categoria";
      if (error.message && error.message.includes('Senha incorreta')) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return {
    categories,
    isLoading,
    createCategory: createCategory.mutate,
    isCreating: createCategory.isPending,
    updateCategory: updateCategory.mutate,
    isUpdating: updateCategory.isPending,
    deleteCategory: deleteCategory.mutate,
    isDeleting: deleteCategory.isPending,
  };
};

export type { WordCategory };
