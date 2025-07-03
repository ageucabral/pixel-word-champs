import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface EmailExchangeResponse {
  success: boolean;
  error?: string;
  requiresVerification?: boolean;
}

export const emailExchangeService = {
  async sendVerificationCode(newEmail: string): Promise<EmailExchangeResponse> {
    try {
      logger.info('Enviando código de verificação', { newEmail });

      // Enviar código de verificação usando o Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(newEmail, {
        redirectTo: `${window.location.origin}/verify-email-exchange`,
      });

      if (error) {
        logger.error('Erro ao enviar código de verificação', { error: error.message });
        return {
          success: false,
          error: 'Erro ao enviar código de verificação'
        };
      }

      logger.info('Código de verificação enviado', { newEmail });
      return {
        success: true,
        requiresVerification: true
      };
    } catch (error) {
      logger.error('Erro no processo de envio de verificação', { error });
      return {
        success: false,
        error: 'Erro inesperado ao enviar verificação'
      };
    }
  },

  async updateUserEmail(newEmail: string): Promise<EmailExchangeResponse> {
    try {
      logger.info('Atualizando email do usuário', { newEmail });

      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        logger.error('Erro ao atualizar email', { error: error.message });
        return {
          success: false,
          error: 'Erro ao atualizar email'
        };
      }

      logger.info('Email atualizado com sucesso', { newEmail });
      return { success: true };
    } catch (error) {
      logger.error('Erro no processo de atualização de email', { error });
      return {
        success: false,
        error: 'Erro inesperado ao atualizar email'
      };
    }
  }
};