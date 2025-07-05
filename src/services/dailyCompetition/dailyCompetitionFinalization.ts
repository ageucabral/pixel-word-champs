
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export class DailyCompetitionFinalizationService {
  async finalizeDailyCompetition(competitionId: string): Promise<void> {
    try {
      logger.info('🏁 Finalizando competição diária independente...', { competitionId }, 'DAILY_COMPETITION_FINALIZATION');

      // Buscar informações da competição diária
      const { data: competition, error: compError } = await supabase
        .from('custom_competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (compError || !competition) {
        logger.error('❌ Competição não encontrada:', { compError }, 'DAILY_COMPETITION_FINALIZATION');
        return;
      }

      // Finalizar a competição diária
      await supabase
        .from('custom_competitions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', competitionId);

      logger.info('✅ Competição diária finalizada com sucesso', {}, 'DAILY_COMPETITION_FINALIZATION');
      logger.info('ℹ️ Ranking semanal será atualizado automaticamente baseado nas pontuações dos perfis', {}, 'DAILY_COMPETITION_FINALIZATION');
    } catch (error) {
      logger.error('❌ Erro ao finalizar competição diária:', { error }, 'DAILY_COMPETITION_FINALIZATION');
    }
  }

  async transferScoresToWeeklyCompetition(dailyCompetitionId: string): Promise<void> {
    try {
      logger.info('ℹ️ Função obsoleta - competições diárias agora são independentes', {}, 'DAILY_COMPETITION_FINALIZATION');
      logger.info('ℹ️ Os pontos vão diretamente para o total_score do perfil do usuário', {}, 'DAILY_COMPETITION_FINALIZATION');
      logger.info('ℹ️ O ranking semanal é atualizado automaticamente baseado no total_score', {}, 'DAILY_COMPETITION_FINALIZATION');
    } catch (error) {
      logger.error('❌ Erro na função obsoleta:', { error }, 'DAILY_COMPETITION_FINALIZATION');
    }
  }
}

export const dailyCompetitionFinalizationService = new DailyCompetitionFinalizationService();
