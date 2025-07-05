
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const useResetScores = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetAllScoresMutation = useMutation({
    mutationFn: async (adminPassword: string) => {
      // Obter usuário atual
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar senha do admin usando autenticação real do Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: currentUser.user.email!,
        password: adminPassword
      });

      if (authError) {
        throw new Error('Senha de administrador incorreta');
      }

      // Zerar pontuação de todos os usuários
      const { error: resetError } = await supabase
        .from('profiles')
        .update({
          total_score: 0,
          games_played: 0
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Atualizar todos

      if (resetError) throw resetError;

      // Registrar ação administrativa
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: currentUser.user.id,
          target_user_id: currentUser.user.id, // Self reference para ação global
          action_type: 'reset_all_scores',
          details: { affected_users: 'all' }
        });

      if (logError) {
        logger.warn('⚠️ Erro ao registrar log:', { logError }, 'USE_RESET_SCORES');
      }
    },
    onSuccess: () => {
      toast({
        title: "Pontuações zeradas",
        description: "A pontuação de todos os usuários foi zerada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao zerar pontuações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    resetAllScores: resetAllScoresMutation.mutate,
    isResettingScores: resetAllScoresMutation.isPending,
  };
};
