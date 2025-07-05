
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';

export const useActiveWords = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: words, isLoading, error, refetch } = useQuery({
    queryKey: ['activeWords'],
    queryFn: async () => {
      logger.info('🔍 Buscando palavras ativas...', undefined, 'USE_ACTIVE_WORDS');
      
      const { data, error } = await supabase
        .from('level_words')
        .select('id, word, category, difficulty, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Erro ao buscar palavras:', { error }, 'USE_ACTIVE_WORDS');
        throw error;
      }

      logger.info('📝 Palavras ativas encontradas:', { count: data?.length }, 'USE_ACTIVE_WORDS');
      return data || [];
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const deleteAllWords = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      // Aqui você pode adicionar validação da senha se necessário
      // Por exemplo, verificar se a senha está correta antes de prosseguir
      
      logger.info('🗑️ Excluindo todas as palavras ativas permanentemente...', undefined, 'USE_ACTIVE_WORDS');
      
      const { error } = await supabase
        .from('level_words')
        .delete()
        .eq('is_active', true);

      if (error) {
        logger.error('❌ Erro ao excluir palavras:', { error }, 'USE_ACTIVE_WORDS');
        throw error;
      }
      
      logger.info('✅ Todas as palavras ativas foram excluídas permanentemente', undefined, 'USE_ACTIVE_WORDS');
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Todas as palavras foram excluídas permanentemente",
      });
      queryClient.invalidateQueries({ queryKey: ['activeWords'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir palavras",
        variant: "destructive",
      });
      logger.error('❌ Erro ao excluir palavras:', { error }, 'USE_ACTIVE_WORDS');
    },
  });

  return {
    words: words || [],
    isLoading,
    error,
    refetch,
    deleteAllWords: (password: string) => deleteAllWords.mutate({ password }),
    isDeletingAll: deleteAllWords.isPending,
  };
};
