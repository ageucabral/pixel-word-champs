
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

export const useUserActions = (userId: string, username: string, onUserUpdated: () => void) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const updateUserRole = async (newRole: 'admin' | 'user') => {
    try {
      setIsLoading(true);
      console.log(`🔄 Atualizando role para ${newRole} do usuário:`, userId);

      // Primeiro, remover todos os roles existentes
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Erro ao remover roles existentes:', deleteError);
        throw deleteError;
      }

      // Depois, adicionar o novo role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole
        });

      if (insertError) {
        console.error('❌ Erro ao adicionar novo role:', insertError);
        throw insertError;
      }

      toast({
        title: "Sucesso!",
        description: `Permissão atualizada para ${newRole === 'admin' ? 'Administrador' : 'Usuário'} para ${username}`,
      });

      onUserUpdated();
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast({
        title: "Erro",
        description: `Erro ao atualizar permissão`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      console.log('🔐 Atualizando senha do usuário:', userId);

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error);
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: `Senha atualizada para ${username}`,
      });
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar senha",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
    updateUserRole,
    updatePassword,
    isLoading,
    isChangingPassword,
  };
};
