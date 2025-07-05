
import { supabase } from '@/integrations/supabase/client';
import { createSuccessResponse, createErrorResponse, handleServiceError } from '@/utils/apiHelpers';
import { ApiResponse } from '@/types';
import { logger } from '@/utils/logger';

export class CompetitionStatusService {
  async updateSingleCompetitionStatus(competitionId: string, newStatus: string): Promise<ApiResponse<void>> {
    try {
      logger.info(`🔄 Atualizando status da competição ${competitionId} para: ${newStatus}`, { competitionId, newStatus }, 'COMPETITION_STATUS_SERVICE');

      const { error } = await supabase
        .from('custom_competitions')
        .update({ 
          status: newStatus
        })
        .eq('id', competitionId);

      if (error) throw error;

      logger.info(`✅ Status da competição ${competitionId} atualizado para: ${newStatus}`, { competitionId, newStatus }, 'COMPETITION_STATUS_SERVICE');
      return createSuccessResponse(undefined);
    } catch (error) {
      logger.error(`❌ Erro ao atualizar status da competição ${competitionId}:`, { competitionId, error }, 'COMPETITION_STATUS_SERVICE');
      return createErrorResponse(handleServiceError(error, 'COMPETITION_STATUS_UPDATE'));
    }
  }

  async getCompetitionsByStatus(status: string): Promise<ApiResponse<any[]>> {
    try {
      logger.info(`🔍 Buscando competições com status: ${status}`, { status }, 'COMPETITION_STATUS_SERVICE');

      const { data, error } = await supabase
        .from('custom_competitions')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      logger.info(`📊 Encontradas ${data?.length || 0} competições com status: ${status}`, { status, count: data?.length || 0 }, 'COMPETITION_STATUS_SERVICE');
      return createSuccessResponse(data || []);
    } catch (error) {
      logger.error(`❌ Erro ao buscar competições por status ${status}:`, { status, error }, 'COMPETITION_STATUS_SERVICE');
      return createErrorResponse(handleServiceError(error, 'COMPETITION_STATUS_QUERY'));
    }
  }

  async finalizeCompetition(competitionId: string): Promise<ApiResponse<void>> {
    try {
      logger.info(`🏁 Finalizando competição: ${competitionId}`, { competitionId }, 'COMPETITION_STATUS_SERVICE');

      const { data: competition, error: fetchError } = await supabase
        .from('custom_competitions')
        .select('id, status, title')
        .eq('id', competitionId)
        .single();

      if (fetchError) throw fetchError;

      if (!competition) {
        throw new Error(`Competição ${competitionId} não encontrada`);
      }

      if (competition.status === 'completed') {
        logger.warn(`⚠️ Competição ${competitionId} já está finalizada`, { competitionId }, 'COMPETITION_STATUS_SERVICE');
        return createSuccessResponse(undefined);
      }

      const { error: updateError } = await supabase
        .from('custom_competitions')
        .update({ 
          status: 'completed'
        })
        .eq('id', competitionId);

      if (updateError) throw updateError;

      logger.info(`✅ Competição "${competition.title}" finalizada com sucesso`, { competitionId, title: competition.title }, 'COMPETITION_STATUS_SERVICE');
      return createSuccessResponse(undefined);
    } catch (error) {
      logger.error(`❌ Erro ao finalizar competição ${competitionId}:`, { competitionId, error }, 'COMPETITION_STATUS_SERVICE');
      return createErrorResponse(handleServiceError(error, 'COMPETITION_FINALIZATION'));
    }
  }
}

export const competitionStatusService = new CompetitionStatusService();
