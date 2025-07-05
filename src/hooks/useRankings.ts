
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { getCurrentBrasiliaDate } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface RankingPlayer {
  pos: number;
  name: string;
  score: number;
  avatar: string;
  trend: string;
  user_id: string;
}

export const useRankings = () => {
  const { toast } = useToast();
  const [weeklyRanking, setWeeklyRanking] = useState<RankingPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const fetchWeeklyRankings = async () => {
    try {
      logger.info('📊 Buscando ranking semanal...', {}, 'USE_RANKINGS');
      
      // Calcular início da semana atual (segunda-feira) usando Brasília
      const today = getCurrentBrasiliaDate();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(today.setDate(diff));
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Buscar dados do ranking semanal
      const { data: rankingData, error: rankingError } = await supabase
        .from('weekly_rankings')
        .select('position, total_score, user_id')
        .eq('week_start', weekStartStr)
        .order('position', { ascending: true })
        .limit(10);

      if (rankingError) throw rankingError;

      if (!rankingData || rankingData.length === 0) {
        logger.info('📊 Nenhum ranking semanal encontrado', {}, 'USE_RANKINGS');
        setWeeklyRanking([]);
        return;
      }

      // Buscar perfis dos usuários separadamente
      const userIds = rankingData.map(item => item.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        logger.warn('⚠️ Erro ao buscar perfis:', { profilesError }, 'USE_RANKINGS');
      }

      // Combinar dados do ranking com perfis
      const rankings = rankingData.map((item) => {
        const profile = profilesData?.find(p => p.id === item.user_id);
        return {
          pos: item.position,
          name: profile?.username || 'Usuário',
          score: item.total_score,
          avatar: profile?.username?.substring(0, 2).toUpperCase() || 'U',
          trend: '',
          user_id: item.user_id
        };
      });

      logger.info('📊 Ranking semanal carregado:', { count: rankings.length }, 'USE_RANKINGS');
      setWeeklyRanking(rankings);
    } catch (error) {
      logger.error('❌ Erro ao carregar ranking semanal:', { error }, 'USE_RANKINGS');
      toast({
        title: "Erro ao carregar ranking semanal",
        description: "Não foi possível carregar os dados do ranking.",
        variant: "destructive",
      });
    }
  };

  const fetchTotalPlayers = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('total_score', 0);

      if (error) throw error;
      
      logger.info('📊 Total de jogadores ativos:', { count }, 'USE_RANKINGS');
      setTotalPlayers(count || 0);
    } catch (error) {
      logger.error('❌ Erro ao buscar total de jogadores:', { error }, 'USE_RANKINGS');
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchWeeklyRankings(),
      fetchTotalPlayers()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    dailyRanking: weeklyRanking, // Mantido para compatibilidade
    weeklyRanking,
    totalPlayers,
    isLoading,
    refreshData
  };
};
