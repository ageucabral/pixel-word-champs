import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types';
import { createSuccessResponse, createErrorResponse, handleServiceError } from '@/utils/apiHelpers';
import { logger } from '@/utils/logger';

export class DailyCompetitionCoreService {
  async getActiveDailyCompetitions(): Promise<ApiResponse<any[]>> {
    try {
      logger.info('🔍 Buscando competições diárias...', {}, 'DAILY_COMPETITION_CORE');

      // IMPORTANTE: Incluir tanto ativas quanto agendadas para exibição
      const { data, error } = await supabase
        .from('custom_competitions')
        .select('*')
        .eq('competition_type', 'challenge')
        .in('status', ['active', 'scheduled']); // Incluir competições agendadas também

      if (error) {
        logger.error('❌ Erro na consulta SQL:', { error }, 'DAILY_COMPETITION_CORE');
        throw error;
      }

      if (!data) {
        logger.warn('⚠️ Nenhum dado retornado do banco', {}, 'DAILY_COMPETITION_CORE');
        return createSuccessResponse([]);
      }

      logger.info(`✅ Total de competições encontradas: ${data.length}`, { count: data.length }, 'DAILY_COMPETITION_CORE');
      logger.info(`✅ Competições para exibir (ativas + agendadas): ${data.length}`, { count: data.length }, 'DAILY_COMPETITION_CORE');
      
      // Log detalhado de cada competição encontrada
      data.forEach((comp, index) => {
        logger.debug(`📋 Competição ${index + 1}:`, {
          id: comp.id,
          title: comp.title,
          status: comp.status,
          start_date: comp.start_date,
          end_date: comp.end_date
        }, 'DAILY_COMPETITION_CORE');
      });

      return createSuccessResponse(data);
    } catch (error) {
      logger.error('❌ Erro ao buscar competições diárias:', { error }, 'DAILY_COMPETITION_CORE');
      return createErrorResponse(handleServiceError(error, 'GET_ACTIVE_DAILY_COMPETITIONS'));
    }
  }

  async getDailyCompetitionRanking(competitionId: string): Promise<ApiResponse<any[]>> {
    try {
      logger.info('📊 Buscando ranking para competição diária:', { competitionId }, 'DAILY_COMPETITION_CORE');
      
      if (!competitionId) {
        logger.error('❌ ID da competição não fornecido', {}, 'DAILY_COMPETITION_CORE');
        return createErrorResponse('ID da competição é obrigatório');
      }

      // Para competições diárias independentes, buscar participações diretas
      const { data: participations, error: participationsError } = await supabase
        .from('game_sessions')
        .select('user_id, total_score, started_at')
        .eq('competition_id', competitionId)
        .eq('is_completed', true)
        .order('total_score', { ascending: false })
        .limit(100);

      if (participationsError) {
        logger.error('❌ Erro ao buscar participações:', { participationsError }, 'DAILY_COMPETITION_CORE');
        throw participationsError;
      }

      if (!participations || participations.length === 0) {
        logger.info('📊 Nenhuma participação encontrada para a competição', {}, 'DAILY_COMPETITION_CORE');
        return createSuccessResponse([]);
      }

      // Buscar perfis dos usuários
      const userIds = participations.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        logger.error('❌ Erro ao buscar perfis:', { profilesError }, 'DAILY_COMPETITION_CORE');
        throw profilesError;
      }

      // Combinar dados e adicionar posições
      const rankingData = participations.map((participation, index) => {
        const profile = profiles?.find(p => p.id === participation.user_id);
        return {
          user_id: participation.user_id,
          user_score: participation.total_score,
          user_position: index + 1,
          created_at: participation.started_at,
          profiles: profile ? {
            username: profile.username,
            avatar_url: profile.avatar_url
          } : null
        };
      });

      logger.info('✅ Ranking da competição diária carregado:', { count: rankingData.length }, 'DAILY_COMPETITION_CORE');
      return createSuccessResponse(rankingData);
    } catch (error) {
      logger.error('❌ Erro ao carregar ranking:', { error }, 'DAILY_COMPETITION_CORE');
      return createErrorResponse(handleServiceError(error, 'GET_DAILY_COMPETITION_RANKING'));
    }
  }

  /**
   * Força atualização manual do status das competições (útil para debug)
   */
  async forceStatusUpdate(): Promise<ApiResponse<any>> {
    try {
      logger.info('🔄 Forçando atualização manual de status...', {}, 'DAILY_COMPETITION_CORE');
      
      const { data, error } = await supabase.rpc('update_daily_competitions_status');
      
      if (error) {
        logger.error('❌ Erro ao forçar atualização:', { error }, 'DAILY_COMPETITION_CORE');
        throw error;
      }

      logger.info('✅ Atualização forçada concluída:', { data }, 'DAILY_COMPETITION_CORE');
      return createSuccessResponse(data);
    } catch (error) {
      logger.error('❌ Erro na atualização forçada:', { error }, 'DAILY_COMPETITION_CORE');
      return createErrorResponse(handleServiceError(error, 'FORCE_STATUS_UPDATE'));
    }
  }
}

export const dailyCompetitionCoreService = new DailyCompetitionCoreService();
