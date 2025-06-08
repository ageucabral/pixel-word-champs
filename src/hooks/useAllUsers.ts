
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useUsersQuery, AllUsersData } from './useUsersQuery';
import { useUserMutations } from './useUserMutations';

export const useAllUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: usersList = [], isLoading, refetch } = useUsersQuery();
  const { banUser, deleteUser, unbanUser, isBanningUser, isDeletingUser, isUnbanningUser } = useUserMutations();

  const validateAdminPassword = async (password: string) => {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) {
      throw new Error('Usuário não autenticado');
    }

    // Validar senha usando uma sessão temporária sem afetar a sessão atual
    const { data, error } = await supabase.auth.signInWithPassword({
      email: currentUser.user.email!,
      password: password
    });

    if (error) {
      throw new Error('Senha de administrador incorreta');
    }

    return true;
  };

  const resetAllScoresMutation = useMutation({
    mutationFn: async (adminPassword: string) => {
      console.log('🔐 Iniciando reset de pontuações...');
      
      // Validar senha real do admin
      await validateAdminPassword(adminPassword);

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('✅ Senha validada, resetando pontuações...');

      // Resetar pontuações de TODOS os usuários com WHERE clause adequada
      const { error } = await supabase
        .from('profiles')
        .update({ 
          total_score: 0,
          games_played: 0,
          best_daily_position: null,
          best_weekly_position: null
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // WHERE clause para todos os IDs válidos

      if (error) {
        console.error('❌ Erro ao resetar pontuações:', error);
        throw error;
      }

      console.log('✅ Pontuações resetadas com sucesso');

      // Registrar ação administrativa
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: currentUser.user.id,
          target_user_id: currentUser.user.id,
          action_type: 'reset_all_scores',
          details: { timestamp: new Date().toISOString() }
        });

      if (logError) {
        console.warn('⚠️ Erro ao registrar log:', logError);
      }
    },
    onSuccess: () => {
      console.log('🎉 Reset concluído com sucesso');
      toast({
        title: "Sucesso!",
        description: "Todas as pontuações foram zeradas.",
      });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['realUserStats'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro no reset:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    usersList,
    isLoading,
    refetch,
    banUser,
    deleteUser,
    unbanUser,
    isBanningUser,
    isDeletingUser,
    isUnbanningUser,
    resetAllScores: resetAllScoresMutation.mutate,
    isResettingScores: resetAllScoresMutation.isPending,
  };
};

export type { AllUsersData };
