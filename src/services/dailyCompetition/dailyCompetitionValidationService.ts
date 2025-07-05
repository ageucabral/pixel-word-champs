
import { supabase } from '@/integrations/supabase/client';
import { createSuccessResponse, createErrorResponse, handleServiceError } from '@/utils/apiHelpers';
import { ApiResponse } from '@/types';
import { createBrasiliaTimestamp } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

export class DailyCompetitionValidationService {
  /**
   * Cria competição diária com validação básica
   */
  async createDailyCompetition(formData: any): Promise<ApiResponse<any>> {
    try {
      logger.info('🔍 Service: Criando competição diária:', { formData }, 'DAILY_COMPETITION_VALIDATION');
      
      // Validação básica
      if (!formData.title || !formData.start_date) {
        throw new Error('Título e data de início são obrigatórios');
      }
      
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      // Inserir no banco
      const { data, error } = await supabase
        .from('custom_competitions')
        .insert({
          ...formData,
          competition_type: 'challenge',
          created_by: user?.id
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Service: Erro ao criar competição:', { error }, 'DAILY_COMPETITION_VALIDATION');
        throw error;
      }

      logger.info('🎉 Service: Competição diária criada com sucesso:', { data }, 'DAILY_COMPETITION_VALIDATION');
      return createSuccessResponse(data);
    } catch (error) {
      logger.error('❌ Service: Erro na criação:', { error }, 'DAILY_COMPETITION_VALIDATION');
      return createErrorResponse(handleServiceError(error, 'CREATE_DAILY_COMPETITION'));
    }
  }

  /**
   * Atualiza competição diária
   */
  async updateDailyCompetition(competitionId: string, formData: any): Promise<ApiResponse<any>> {
    try {
      logger.info('🔍 Service: Atualizando competição diária:', { competitionId, formData }, 'DAILY_COMPETITION_VALIDATION');
      
      // Validação básica
      if (!formData.title || !formData.start_date) {
        throw new Error('Título e data de início são obrigatórios');
      }
      
      // Atualizar no banco
      const { data, error } = await supabase
        .from('custom_competitions')
        .update({
          ...formData,
          updated_at: createBrasiliaTimestamp(new Date().toString())
        })
        .eq('id', competitionId)
        .eq('competition_type', 'challenge')
        .select()
        .single();

      if (error) {
        logger.error('❌ Service: Erro ao atualizar competição:', { error }, 'DAILY_COMPETITION_VALIDATION');
        throw error;
      }

      if (!data) {
        throw new Error('Competição não encontrada ou não é uma competição diária');
      }

      logger.info('🎉 Service: Competição diária atualizada com sucesso:', { data }, 'DAILY_COMPETITION_VALIDATION');
      return createSuccessResponse(data);
    } catch (error) {
      logger.error('❌ Service: Erro na atualização:', { error }, 'DAILY_COMPETITION_VALIDATION');
      return createErrorResponse(handleServiceError(error, 'UPDATE_DAILY_COMPETITION'));
    }
  }

  /**
   * Verifica competições diárias básicas
   */
  async validateAllDailyCompetitions(): Promise<ApiResponse<any>> {
    try {
      logger.info('🔍 Service: Verificando todas as competições diárias...', {}, 'DAILY_COMPETITION_VALIDATION');
      
      // Buscar todas as competições diárias
      const { data: competitions, error } = await supabase
        .from('custom_competitions')
        .select('id, title, start_date, end_date, status, prize_pool')
        .eq('competition_type', 'challenge');

      if (error) {
        throw error;
      }

      logger.info(`✅ Verificação concluída. ${competitions?.length || 0} competições verificadas.`, { count: competitions?.length || 0 }, 'DAILY_COMPETITION_VALIDATION');
      return createSuccessResponse({ 
        totalChecked: competitions?.length || 0, 
        competitions: competitions || [] 
      });
    } catch (error) {
      logger.error('❌ Service: Erro na validação:', { error }, 'DAILY_COMPETITION_VALIDATION');
      return createErrorResponse(handleServiceError(error, 'VALIDATE_ALL_DAILY_COMPETITIONS'));
    }
  }
}

export const dailyCompetitionValidationService = new DailyCompetitionValidationService();
