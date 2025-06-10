
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserStats {
  position: number | null;
  totalScore: number;
  gamesPlayed: number;
  winStreak: number;
  bestDailyPosition: number | null;
  bestWeeklyPosition: number | null;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    position: null,
    totalScore: 0,
    gamesPlayed: 0,
    winStreak: 0,
    bestDailyPosition: null,
    bestWeeklyPosition: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('📊 Carregando estatísticas do usuário:', user.id);

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Buscar posição atual no ranking geral baseado na pontuação total
      const { data: allProfiles, error: rankingError } = await supabase
        .from('profiles')
        .select('id, total_score')
        .order('total_score', { ascending: false });

      if (rankingError) {
        console.warn('Erro ao buscar ranking geral:', rankingError);
      }

      let currentPosition = null;
      if (allProfiles) {
        const userRankIndex = allProfiles.findIndex(p => p.id === user.id);
        if (userRankIndex !== -1) {
          currentPosition = userRankIndex + 1;
        }
      }

      // Calcular sequência de vitórias baseada em jogos completados recentemente
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentSessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('completed_at, is_completed')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (sessionsError) {
        console.warn('Erro ao buscar sessões:', sessionsError);
      }

      // Calcular sequência contínua de dias com jogos
      let streak = 0;
      const completedDates = new Set(
        recentSessions?.map(session => 
          new Date(session.completed_at).toDateString()
        ) || []
      );

      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        if (completedDates.has(checkDate.toDateString())) {
          streak++;
        } else if (i > 0) {
          break; // Quebra na primeira data sem atividade (exceto hoje)
        }
      }

      const userStats = {
        position: currentPosition,
        totalScore: profile?.total_score || 0,
        gamesPlayed: profile?.games_played || 0,
        winStreak: streak,
        bestDailyPosition: profile?.best_daily_position || null,
        bestWeeklyPosition: profile?.best_weekly_position || null
      };

      console.log('📊 Estatísticas do usuário carregadas:', userStats);
      setStats(userStats);
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas do usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    isLoading,
    refetch: loadUserStats
  };
};
