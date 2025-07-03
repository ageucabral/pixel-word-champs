
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const validateAdminRole = async () => {
  const { data: currentUser } = await supabase.auth.getUser();
  if (!currentUser.user) {
    throw new Error('Usuário não autenticado');
  }

  logger.debug('Verificando role de administrador', { userId: currentUser.user.id }, 'BAN_USER_MUTATION');

  // Usar a função is_admin() do banco para verificar permissões
  const { data: isAdmin, error } = await supabase.rpc('is_admin');

  if (error) {
    logger.error('Erro ao verificar role de admin', { error: error.message }, 'BAN_USER_MUTATION');
    throw new Error('Erro ao verificar permissões de administrador');
  }

  if (!isAdmin) {
    logger.error('Usuário não tem permissão de admin', { userId: currentUser.user.id }, 'BAN_USER_MUTATION');
    throw new Error('Acesso negado: apenas administradores podem realizar esta ação');
  }

  logger.debug('Role de admin validada com sucesso', undefined, 'BAN_USER_MUTATION');
  return true;
};

export const useBanUserMutation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      logger.info('Iniciando banimento do usuário', { targetUserId: userId }, 'BAN_USER_MUTATION');
      
      // Validar role de admin
      await validateAdminRole();

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Usuário não autenticado');
      }

      logger.debug('Credenciais validadas, banindo usuário...', undefined, 'BAN_USER_MUTATION');

      // Banir usuário específico usando as novas políticas
      const { error: banError } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_by: currentUser.user.id,
          ban_reason: reason
        })
        .eq('id', userId);

      if (banError) {
        logger.error('Erro ao banir usuário', { error: banError.message }, 'BAN_USER_MUTATION');
        throw banError;
      }

      logger.info('Usuário banido com sucesso', { targetUserId: userId }, 'BAN_USER_MUTATION');

      // Registrar ação administrativa usando as novas políticas
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: currentUser.user.id,
          target_user_id: userId,
          action_type: 'ban_user',
          details: { reason }
        });

      if (logError) {
        logger.warn('Erro ao registrar log de ação administrativa', { error: logError.message }, 'BAN_USER_MUTATION');
      }
    },
    onSuccess: () => {
      logger.info('Banimento concluído com sucesso', undefined, 'BAN_USER_MUTATION');
      toast({
        title: "Usuário banido",
        description: "O usuário foi banido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (error: any) => {
      logger.error('Erro no banimento', { error: error.message }, 'BAN_USER_MUTATION');
      toast({
        title: "Erro ao banir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    banUser: banUserMutation.mutate,
    isBanningUser: banUserMutation.isPending,
  };
};
