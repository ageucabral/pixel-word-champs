
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WeeklyConfig } from '@/types/weeklyConfig';
import { logger } from '@/utils/logger';

interface CompetitionHistoryStats {
  totalParticipants: number;
  totalPrizePool: number;
  winnersCount: number;
}

interface CompetitionHistoryItem extends Omit<WeeklyConfig, 'status'> {
  status: string; // Permitir qualquer string do banco
  stats?: CompetitionHistoryStats;
}

export const useWeeklyCompetitionHistory = (page: number = 1, pageSize: number = 5) => {
  const [historyData, setHistoryData] = useState<CompetitionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calcular offset para paginação
      const offset = (page - 1) * pageSize;

      // Buscar competições finalizadas com contagem total
      const { data: historyConfigs, error: historyError, count } = await supabase
        .from('weekly_config')
        .select('*', { count: 'exact' })
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (historyError) throw historyError;

      // Calcular total de páginas
      const totalItems = count || 0;
      setTotalPages(Math.ceil(totalItems / pageSize));

      // Para cada competição, buscar estatísticas detalhadas
      const historyWithStats = await Promise.all(
        (historyConfigs || []).map(async (config) => {
          try {
            // Buscar dados do snapshot se existir
            const { data: snapshotData } = await supabase
              .from('weekly_competitions_snapshot')
              .select('total_participants, total_prize_pool, winners_data')
              .eq('competition_id', config.id)
              .maybeSingle();

            if (snapshotData) {
              const winnersCount = Array.isArray(snapshotData.winners_data) 
                ? snapshotData.winners_data.length 
                : 0;

              return {
                ...config,
                stats: {
                  totalParticipants: snapshotData.total_participants || 0,
                  totalPrizePool: Number(snapshotData.total_prize_pool) || 0,
                  winnersCount
                }
              } as CompetitionHistoryItem;
            }

            // Fallback: buscar dados do ranking semanal
            const { data: rankingData } = await supabase
              .from('weekly_rankings')
              .select('user_id, prize_amount')
              .eq('week_start', config.start_date)
              .eq('week_end', config.end_date);

            const totalParticipants = rankingData?.length || 0;
            const totalPrizePool = rankingData?.reduce((sum, r) => sum + Number(r.prize_amount || 0), 0) || 0;
            const winnersCount = rankingData?.filter(r => Number(r.prize_amount || 0) > 0).length || 0;

            return {
              ...config,
              stats: {
                totalParticipants,
                totalPrizePool,
                winnersCount
              }
            } as CompetitionHistoryItem;
          } catch (error) {
            logger.error('Erro ao buscar stats para competição:', { competitionId: config.id, error }, 'USE_WEEKLY_COMPETITION_HISTORY');
            return {
              ...config,
              stats: {
                totalParticipants: 0,
                totalPrizePool: 0,
                winnersCount: 0
              }
            } as CompetitionHistoryItem;
          }
        })
      );

      setHistoryData(historyWithStats);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar histórico';
      setError(errorMessage);
      logger.error('Erro ao carregar histórico:', { error }, 'USE_WEEKLY_COMPETITION_HISTORY');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, pageSize]);

  return {
    historyData,
    isLoading,
    error,
    totalPages,
    refetch: fetchHistory
  };
};
