import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { createBrasiliaTimestamp } from '@/utils/brasiliaTimeUnified';
import { detectInputType, formatPhoneBR } from '@/utils/emailPhoneDetection';

interface AuthData {
  emailOrPhone: string;
  password: string;
  username?: string;
}

export const authService = {
  async signUp(data: AuthData) {
    try {
      logger.info('Iniciando processo de cadastro', { emailOrPhone: data.emailOrPhone, username: data.username });

      // Detectar se é email ou telefone
      const inputType = detectInputType(data.emailOrPhone);
      let emailForAuth = data.emailOrPhone;
      let phoneNumber = null;

      // Se for telefone, criar email temporário e formatar telefone
      if (inputType === 'phone') {
        phoneNumber = formatPhoneBR(data.emailOrPhone);
        emailForAuth = `${phoneNumber.replace(/\D/g, '')}@phone.app`;
        logger.info('Cadastro com telefone detectado', { phone: phoneNumber, tempEmail: emailForAuth });
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailForAuth,
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
        // Atualizar perfil com dados completos
        const profileUpdates: any = {
          username: data.username,
          updated_at: createBrasiliaTimestamp(new Date().toString())
        };

        // Se é cadastro com telefone, salvar o telefone no perfil
        if (phoneNumber) {
          profileUpdates.phone = phoneNumber;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', authData.user.id);

        if (profileError) {
          logger.warn('Erro ao atualizar perfil', { error: profileError.message });
        }
      }

      logger.info('Cadastro realizado com sucesso', { userId: authData.user?.id, inputType });
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

      // Detectar se é email ou telefone
      const inputType = detectInputType(emailOrPhone);
      let emailForAuth = emailOrPhone;

      // Se for telefone, buscar o email temporário correspondente
      if (inputType === 'phone') {
        const phoneNumber = formatPhoneBR(emailOrPhone);
        emailForAuth = `${phoneNumber.replace(/\D/g, '')}@phone.app`;
        logger.info('Login com telefone detectado', { phone: phoneNumber, tempEmail: emailForAuth });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailForAuth,
        password
      });

      if (error) {
        logger.error('Erro no login', { error: error.message });
        throw error;
      }

      logger.info('Login realizado com sucesso', { userId: data.user?.id, rememberMe, inputType });
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

  async resetPassword(emailOrPhone: string) {
    try {
      logger.info('Iniciando processo de recuperação de senha', { emailOrPhone }, 'AUTH_SERVICE');

      // Detectar se é email ou telefone
      const inputType = detectInputType(emailOrPhone);
      let emailForAuth = emailOrPhone;

      // Se for telefone, converter para email temporário
      if (inputType === 'phone') {
        const phoneNumber = formatPhoneBR(emailOrPhone);
        emailForAuth = `${phoneNumber.replace(/\D/g, '')}@phone.app`;
        logger.info('Recuperação com telefone detectado', { phone: phoneNumber, tempEmail: emailForAuth });
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailForAuth, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        logger.error('Erro na recuperação de senha', { error: error.message }, 'AUTH_SERVICE');
        throw error;
      }

      logger.info('Email de recuperação enviado com sucesso', { emailOrPhone, inputType }, 'AUTH_SERVICE');
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
