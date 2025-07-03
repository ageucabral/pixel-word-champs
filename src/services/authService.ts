import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { createBrasiliaTimestamp } from '@/utils/brasiliaTimeUnified';

interface AuthData {
  emailOrPhone: string;
  password: string;
  username?: string;
}

export const authService = {
  async signUp(data: AuthData) {
    try {
      logger.info('Iniciando processo de cadastro', { emailOrPhone: data.emailOrPhone, username: data.username });

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.emailOrPhone, // Assumindo que é email para Supabase
        password: data.password,
        options: {
          data: {
            username: data.username
          }
        }
      });

      if (authError) {
        logger.error('Erro no cadastro', { error: authError.message });
        throw authError;
      }

      if (authData.user) {
        // Atualizar perfil com timestamp de Brasília
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            username: data.username,
            updated_at: createBrasiliaTimestamp(new Date().toString())
          })
          .eq('id', authData.user.id);

        if (profileError) {
          logger.warn('Erro ao atualizar perfil', { error: profileError.message });
        }
      }

      logger.info('Cadastro realizado com sucesso', { userId: authData.user?.id });
      return { data: authData, error: null };
    } catch (error) {
      logger.error('Erro no processo de cadastro', { error });
      return { data: null, error };
    }
  },

  async signIn(emailOrPhone: string, password: string, rememberMe: boolean = false) {
    try {
      logger.info('Iniciando processo de login', { emailOrPhone, rememberMe });

      // Configurar o tipo de armazenamento antes do login
      if (rememberMe) {
        // Usar localStorage (persistir entre sessões)
        sessionStorage.removeItem('use-session-only');
      } else {
        // Usar sessionStorage (expirar ao fechar browser)
        sessionStorage.setItem('use-session-only', 'true');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone, // Assumindo que é email para Supabase
        password
      });

      if (error) {
        logger.error('Erro no login', { error: error.message });
        throw error;
      }

      logger.info('Login realizado com sucesso', { userId: data.user?.id, rememberMe });
      return { data, error: null };
    } catch (error) {
      logger.error('Erro no processo de login', { error });
      return { data: null, error };
    }
  },

  async signOut() {
    try {
      logger.info('Iniciando processo de logout');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Erro no logout', { error: error.message });
        throw error;
      }

      logger.info('Logout realizado com sucesso');
      return { error: null };
    } catch (error) {
      logger.error('Erro no processo de logout', { error });
      return { error };
    }
  },

  async resetPassword(email: string) {
    try {
      logger.info('Iniciando processo de recuperação de senha', { email }, 'AUTH_SERVICE');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logger.error('Erro na recuperação de senha', { error: error.message }, 'AUTH_SERVICE');
        throw error;
      }

      logger.info('Email de recuperação enviado com sucesso', { email }, 'AUTH_SERVICE');
      return { error: null };
    } catch (error) {
      logger.error('Erro no processo de recuperação de senha', { error }, 'AUTH_SERVICE');
      return { error };
    }
  },

  async updateProfile(userId: string, updates: any) {
    try {
      logger.info('Atualizando perfil do usuário', { userId, updates });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: createBrasiliaTimestamp(new Date().toString())
        })
        .eq('id', userId)
        .select('id, username, avatar_url, total_score, games_played, experience_points, pix_key, pix_holder_name, phone, created_at, updated_at')
        .single();

      if (error) {
        logger.error('Erro ao atualizar perfil', { error: error.message });
        throw error;
      }

      logger.info('Perfil atualizado com sucesso', { userId });
      return { data, error: null };
    } catch (error) {
      logger.error('Erro no processo de atualização do perfil', { error });
      return { data: null, error };
    }
  }
};
