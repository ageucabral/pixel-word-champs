import { supabase } from '@/integrations/supabase/client';
import { createSuccessResponse, createErrorResponse, handleServiceError } from '@/utils/apiHelpers';
import { logger } from '@/utils/logger';

interface ScoreUpdateResult {
  total_score: number;
  games_played: number;
  experience_points?: number;
}

class GameScoreService {
  /**
   * Atualizar pontuações usando a RPC update_user_scores CORRIGIDA
   */
  async updateGameScore(userId: string, gamePoints: number, competitionId?: string) {
    try {
      logger.info('💾 Atualizando pontuação com update_user_scores CORRIGIDA', { 
        userId, 
        gamePoints, 
        competitionId 
      }, 'GAME_SCORE_SERVICE');

      // Converter pontos do jogo para XP permanente (1:1 por enquanto)
      const experiencePointsToAdd = gamePoints;

      // Usar RPC update_user_scores corrigida para atualizar com expressões SQL
      const { data, error } = await supabase.rpc('update_user_scores', {
        p_user_id: userId,
        p_game_points: gamePoints,
        p_experience_points: experiencePointsToAdd
      });

      if (error) {
        logger.error('❌ Erro na RPC update_user_scores', { 
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          },
          userId,
          gamePoints
        }, 'GAME_SCORE_SERVICE');
        throw error;
      }

      if (!data || data.length === 0) {
        logger.warn('⚠️ RPC executou mas não retornou dados', { 
          userId,
          gamePoints,
          data
        }, 'GAME_SCORE_SERVICE');
        
        return createErrorResponse('Função executou mas não retornou dados');
      }

      logger.info('✅ Pontuação atualizada com sucesso!', { 
        userId,
        gamePoints,
        newTotalScore: data[0]?.total_score,
        newExperiencePoints: data[0]?.experience_points,
        newGamesPlayed: data[0]?.games_played
      }, 'GAME_SCORE_SERVICE');

      return createSuccessResponse({
        total_score: data[0]?.total_score,
        games_played: data[0]?.games_played,
        experience_points: data[0]?.experience_points
      } as ScoreUpdateResult);
    } catch (error) {
      logger.error('❌ Erro crítico ao atualizar pontuação', { 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        userId, 
        gamePoints 
      }, 'GAME_SCORE_SERVICE');
      return createErrorResponse(handleServiceError(error, 'updateGameScore'));
    }
  }

  /**
   * Obter estatísticas separadas do usuário
   */
  async getUserScoreStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_score, experience_points, games_played')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return createSuccessResponse({
        temporaryScore: data.total_score || 0, // Pontos para competições
        permanentXP: data.experience_points || 0, // XP permanente
        gamesPlayed: data.games_played || 0
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas do usuário', { error, userId }, 'GAME_SCORE_SERVICE');
      return createErrorResponse(handleServiceError(error, 'getUserScoreStats'));
    }
  }

}

export const gameScoreService = new GameScoreService();
