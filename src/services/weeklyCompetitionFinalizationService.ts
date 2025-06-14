
import { supabase } from '@/integrations/supabase/client';
import { competitionHistoryService } from './competitionHistoryService';
import { dynamicPrizeService } from './dynamicPrizeService';
import { logger } from '@/utils/logger';

class WeeklyCompetitionFinalizationService {
  async finalizeWeeklyCompetition(competitionId: string): Promise<void> {
    try {
      logger.log('🏁 Iniciando finalização da competição semanal:', competitionId);

      // 1. Buscar dados da competição
      const { data: competition, error: compError } = await supabase
        .from('custom_competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (compError || !competition) {
        throw new Error('Competição não encontrada');
      }

      // 2. Buscar todas as participações com dados dos usuários
      const { data: participations, error: participationError } = await supabase
        .from('competition_participations')
        .select(`
          *,
          profiles:user_id (
            id,
            username
          )
        `)
        .eq('competition_id', competitionId)
        .order('user_score', { ascending: false });

      if (participationError) {
        throw new Error('Erro ao buscar participações');
      }

      if (!participations || participations.length === 0) {
        logger.log('⚠️ Nenhuma participação encontrada para finalizar');
        return;
      }

      logger.log(`📊 Finalizando competição com ${participations.length} participantes`);

      // 3. Calcular prêmios dinamicamente baseado nas configurações
      const participantsData = participations.map(p => ({
        user_id: p.user_id,
        user_score: p.user_score || 0
      }));

      const participantsWithPrizes = await dynamicPrizeService.calculateDynamicPrizes(participantsData);

      logger.log('🎯 Prêmios calculados dinamicamente:', {
        totalParticipants: participantsWithPrizes.length,
        winnersCount: participantsWithPrizes.filter(p => p.prize > 0).length,
        totalPrizePool: participantsWithPrizes.reduce((sum, p) => sum + p.prize, 0)
      });

      // 4. Mapear dados para o histórico
      const historyData = participantsWithPrizes.map(participant => {
        const originalParticipation = participations.find(p => p.user_id === participant.user_id);
        
        return {
          competitionId: competition.id,
          competitionTitle: competition.title,
          competitionType: competition.competition_type,
          userId: participant.user_id,
          finalScore: participant.score,
          finalPosition: participant.position,
          totalParticipants: participations.length,
          prizeEarned: participant.prize,
          competitionStartDate: competition.start_date,
          competitionEndDate: competition.end_date
        };
      });

      // 5. Salvar no histórico da competição
      await competitionHistoryService.saveCompetitionHistory(historyData);

      // 6. Atualizar prêmios nas participações atuais
      for (const participant of participantsWithPrizes) {
        if (participant.prize > 0) {
          const originalParticipation = participations.find(p => p.user_id === participant.user_id);
          
          if (originalParticipation) {
            await supabase
              .from('competition_participations')
              .update({ 
                prize: participant.prize,
                user_position: participant.position
              })
              .eq('id', originalParticipation.id);
          }
        }
      }

      // 7. Zerar pontuações de todos os participantes para próxima competição
      logger.log('🔄 Zerando pontuações dos participantes...');
      
      const userIds = participations.map(p => p.user_id);
      
      const { error: resetError } = await supabase
        .from('profiles')
        .update({ total_score: 0 })
        .in('id', userIds);

      if (resetError) {
        logger.error('❌ Erro ao zerar pontuações:', resetError);
        // Não falhar a finalização por causa disso, apenas logar
      } else {
        logger.log('✅ Pontuações dos participantes zeradas com sucesso');
      }

      // 8. Marcar competição como finalizada
      await supabase
        .from('custom_competitions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', competitionId);

      logger.log('✅ Competição semanal finalizada com sucesso');
      logger.log(`📈 Histórico salvo para ${participations.length} participantes`);
      logger.log(`💰 Total de prêmios distribuídos: R$ ${participantsWithPrizes.reduce((sum, p) => sum + p.prize, 0)}`);
      logger.log(`🏆 Ganhadores: ${participantsWithPrizes.filter(p => p.prize > 0).length}`);
      logger.log('🔄 Participantes prontos para nova competição');

    } catch (error) {
      logger.error('❌ Erro ao finalizar competição semanal:', error);
      throw error;
    }
  }

  async resetUserScoresForNewCompetition(userIds: string[]): Promise<void> {
    try {
      logger.log('🔄 Zerando pontuações para nova competição...');

      const { error } = await supabase
        .from('profiles')
        .update({ total_score: 0 })
        .in('id', userIds);

      if (error) {
        logger.error('❌ Erro ao zerar pontuações:', error);
        throw error;
      }

      logger.log(`✅ Pontuações zeradas para ${userIds.length} usuários`);
    } catch (error) {
      logger.error('❌ Erro no reset de pontuações:', error);
      throw error;
    }
  }
}

export const weeklyCompetitionFinalizationService = new WeeklyCompetitionFinalizationService();
