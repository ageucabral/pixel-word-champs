
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const validateAdminRole = async () => {
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    throw new Error('Usuário não autenticado');
  }

  logger.debug('Verificando role de administrador', { userId: currentUser.user.id }, 'UNBAN_USER_MUTATION');

  // Usar a função is_admin() do banco para verificar permissões
  const { data: isAdmin, error } = await supabase.rpc('is_admin');

  if (error) {
    logger.error('Erro ao verificar role de admin', { error: error.message }, 'UNBAN_USER_MUTATION');
    throw new Error('Erro ao verificar permissões de administrador');
  }

  if (!isAdmin) {
    logger.error('Usuário não tem permissão de admin', { userId: currentUser.user.id }, 'UNBAN_USER_MUTATION');
    throw new Error('Acesso negado: apenas administradores podem realizar esta ação');
  }

  logger.debug('Role de admin validada com sucesso', undefined, 'UNBAN_USER_MUTATION');
  return true;
};

export const useUnbanUserMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const unbanUserMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      logger.info('Iniciando desbloqueio do usuário', { targetUserId: userId }, 'UNBAN_USER_MUTATION');
      
      // Validar role de admin
      await validateAdminRole();

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Usuário não autenticado');
      }

      logger.debug('Credenciais validadas, desbloqueando usuário...', undefined, 'UNBAN_USER_MUTATION');

      // Desbanir usuário usando as novas políticas padronizadas
      const { error: unbanError } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_at: null,
          banned_by: null,
          ban_reason: null
        })
        .eq('id', userId);

      if (unbanError) {
        logger.error('Erro ao desbanir usuário', { error: unbanError.message }, 'UNBAN_USER_MUTATION');
        throw unbanError;
      }

      logger.info('Usuário desbloqueado com sucesso', { targetUserId: userId }, 'UNBAN_USER_MUTATION');

      // Registrar ação administrativa usando as novas políticas
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: currentUser.user.id,
          target_user_id: userId,
          action_type: 'unban_user',
          details: { timestamp: new Date().toISOString() }
        });

      if (logError) {
        logger.warn('Erro ao registrar log de ação administrativa', { error: logError.message }, 'UNBAN_USER_MUTATION');
      }
    },
    onSuccess: () => {
      logger.info('Desbloqueio concluído com sucesso', undefined, 'UNBAN_USER_MUTATION');
      toast({
        title: "Usuário desbloqueado",
        description: "O usuário foi desbloqueado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (error: any) => {
      logger.error('Erro no desbloqueio', { error: error.message }, 'UNBAN_USER_MUTATION');
      toast({
        title: "Erro ao desbloquear usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    unbanUser: unbanUserMutation.mutate,
    isUnbanningUser: unbanUserMutation.isPending,
  };
};
