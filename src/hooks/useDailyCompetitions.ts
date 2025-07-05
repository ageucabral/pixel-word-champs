
import { useState, useEffect } from 'react';
import { dailyCompetitionService } from '@/services/dailyCompetitionService';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

export const useDailyCompetitions = () => {
  const [activeCompetitions, setActiveCompetitions] = useState<any[]>([]);
  const [competitionRankings, setCompetitionRankings] = useState<Record<string, any[]>>({});
  const [userParticipations, setUserParticipations] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveCompetitions = async () => {
    logger.info('🎯 Iniciando busca por competições diárias ativas...', {
      timestamp: getCurrentBrasiliaTime()
    }, 'USE_DAILY_COMPETITIONS');
    setIsLoading(true);
    setError(null);

    try {
      const response = await dailyCompetitionService.getActiveDailyCompetitions();
      logger.info('📊 Resposta do serviço:', { responseStatus: response.success }, 'USE_DAILY_COMPETITIONS');
      
      if (response.success) {
        logger.info('✅ Competições encontradas:', { 
          count: response.data.length,
          timestamp: getCurrentBrasiliaTime()
        }, 'USE_DAILY_COMPETITIONS');
        setActiveCompetitions(response.data);
        
        // Carregar rankings para cada competição ativa
        const rankings: Record<string, any[]> = {};
        for (const competition of response.data) {
          const rankingResponse = await dailyCompetitionService.getDailyCompetitionRanking(competition.id);
          if (rankingResponse.success) {
            rankings[competition.id] = rankingResponse.data;
          }
        }
        setCompetitionRankings(rankings);
      } else {
        logger.error('❌ Erro na resposta:', { 
          error: response.error,
          timestamp: getCurrentBrasiliaTime()
        }, 'USE_DAILY_COMPETITIONS');
        setError(response.error || 'Erro ao carregar competições diárias');
      }
    } catch (err) {
      logger.error('❌ Erro ao carregar dados das competições diárias:', { 
        error: err,
        timestamp: getCurrentBrasiliaTime()
      }, 'USE_DAILY_COMPETITIONS');
      setError('Erro ao carregar dados das competições diárias');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserParticipation = async (userId: string, competitionId: string): Promise<boolean> => {
    try {
      const hasParticipated = await dailyCompetitionService.checkUserParticipation(userId, competitionId);
      setUserParticipations(prev => ({
        ...prev,
        [`${userId}-${competitionId}`]: hasParticipated
      }));
      return hasParticipated;
    } catch (error) {
      logger.error('❌ Erro ao verificar participação:', { 
        error,
        timestamp: getCurrentBrasiliaTime()
      }, 'USE_DAILY_COMPETITIONS');
      return false;
    }
  };

  const refreshRanking = async (competitionId: string) => {
    try {
      const response = await dailyCompetitionService.getDailyCompetitionRanking(competitionId);
      if (response.success) {
        setCompetitionRankings(prev => ({
          ...prev,
          [competitionId]: response.data
        }));
      }
    } catch (error) {
      logger.error('❌ Erro ao atualizar ranking:', { 
        error,
        timestamp: getCurrentBrasiliaTime()
      }, 'USE_DAILY_COMPETITIONS');
    }
  };

  useEffect(() => {
    fetchActiveCompetitions();
  }, []);

  return {
    activeCompetitions,
    competitionRankings,
    userParticipations,
    isLoading,
    error,
    refetch: fetchActiveCompetitions,
    refreshRanking,
    checkUserParticipation
  };
};
