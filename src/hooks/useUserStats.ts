
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentBrasiliaDate, createBrasiliaTimestamp } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

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
  const channelRef = useRef<any>(null);

  const loadUserStats = useCallback(async (retryCount = 0) => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    
    // Retry inteligente - máximo 3 tentativas com delay crescente
    const maxRetries = 3;
    const retryDelay = (retryCount + 1) * 1000; // 1s, 2s, 3s
    
    try {
      // Estado do usuário verificado

      // Verificar sessão ativa
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // Se não há sessão ativa, aguardar e tentar novamente
      if (!session?.user?.id || session.user.id !== user.id) {
        if (retryCount < maxRetries) {
          setTimeout(() => {
            loadUserStats(retryCount + 1);
          }, retryDelay);
          return;
        } else {
          setIsLoading(false);
          return;
        }
      }

      // Query de verificação direta
      const { data: directCheck, error: directError } = await supabase
        .from('profiles')
        .select('id, username, total_score, games_played, best_daily_position, best_weekly_position')
        .eq('id', user.id);

      // Buscar perfil do usuário com retry logic
      let profile = null;
      let profileError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, total_score, games_played, best_daily_position, best_weekly_position')
          .eq('id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          profileError = error;
          if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        profile = data;
        profileError = null;
        break;
      }

      if (profileError) {
        // Se ainda há tentativas restantes, retry com delay
        if (retryCount < maxRetries) {
          setTimeout(() => {
            loadUserStats(retryCount + 1);
          }, retryDelay);
          return;
        }
        
        throw profileError;
      }

      if (!profile) {
        // Criar perfil padrão se não existir
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.username || 'Usuário',
            total_score: 0,
            games_played: 0
          });
        
        profile = {
          id: user.id,
          total_score: 0,
          games_played: 0,
          best_daily_position: null,
          best_weekly_position: null
        };
      }

      // Buscar posição no ranking semanal atual usando horário de Brasília
      const today = getCurrentBrasiliaDate();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(today.setDate(diff));
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Buscar ranking semanal

      const { data: weeklyRanking, error: weeklyError } = await supabase
        .from('weekly_rankings')
        .select('position')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      // Ignorar erros de dados não encontrados

      // Calcular sequência de vitórias baseada em jogos completados recentemente
      const sevenDaysAgo = getCurrentBrasiliaDate();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Buscar sessões recentes

      const { data: recentSessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('completed_at, is_completed')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .gte('completed_at', createBrasiliaTimestamp(sevenDaysAgo.toString()))
        .order('completed_at', { ascending: false });

      // Ignorar erros na busca de sessões

      // Calcular sequência contínua de dias com jogos
      let streak = 0;
      const completedDates = new Set(
        recentSessions?.map(session => 
          new Date(session.completed_at).toDateString()
        ) || []
      );

      // Calcular streak de atividade

      for (let i = 0; i < 7; i++) {
        const checkDate = getCurrentBrasiliaDate();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toDateString();
        const hasActivity = completedDates.has(dateStr);
        
        if (hasActivity) {
          streak++;
        } else if (i > 0) {
          break; // Quebra na primeira data sem atividade (exceto hoje)
        }
      }

      const userStats = {
        position: weeklyRanking?.position || null,
        totalScore: profile?.total_score || 0,
        gamesPlayed: profile?.games_played || 0,
        winStreak: streak,
        bestDailyPosition: profile?.best_daily_position || null,
        bestWeeklyPosition: profile?.best_weekly_position || null
      };

      // Definir estatísticas finais
      setStats(userStats);
    } catch (error) {
      // Se ainda há tentativas restantes, retry com delay
      if (retryCount < maxRetries) {
        setTimeout(() => {
          loadUserStats(retryCount + 1);
        }, retryDelay);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Debounced loading para evitar timing issues
  const debouncedLoadStats = useCallback(() => {
    const timeoutId = setTimeout(() => {
      loadUserStats();
    }, 300); // 300ms debounce para permitir consolidação da sessão
    
    return () => clearTimeout(timeoutId);
  }, [loadUserStats]);

  useEffect(() => {
    if (user?.id) {
      const cleanup = debouncedLoadStats();
      return cleanup;
    } else {
      setIsLoading(false);
    }
  }, [user?.id, debouncedLoadStats]);

  // Configurar realtime para atualizações dinâmicas do ranking
  useEffect(() => {
    if (!user?.id) return;

    logger.debug('Configurando realtime para atualização do ranking', { userId: user.id }, 'USER_STATS_REALTIME');

    // Limpar canal anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Criar canal para escutar mudanças no ranking
    const channel = supabase
      .channel('user-ranking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_rankings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          logger.debug('Mudança detectada no ranking do usuário', { 
            payload, 
            userId: user.id 
          }, 'USER_STATS_REALTIME');
          
          // Atualizar posição em tempo real
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newRanking = payload.new;
            setStats(prevStats => ({
              ...prevStats,
              position: newRanking?.position || null
            }));
          } else if (payload.eventType === 'DELETE') {
            setStats(prevStats => ({
              ...prevStats,
              position: null
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          logger.debug('Mudança detectada no perfil do usuário', { 
            payload, 
            userId: user.id 
          }, 'USER_STATS_REALTIME');
          
          // Atualizar estatísticas do perfil em tempo real
          if (payload.eventType === 'UPDATE') {
            const newProfile = payload.new;
            setStats(prevStats => ({
              ...prevStats,
              totalScore: newProfile?.total_score || 0,
              gamesPlayed: newProfile?.games_played || 0,
              bestDailyPosition: newProfile?.best_daily_position || null,
              bestWeeklyPosition: newProfile?.best_weekly_position || null
            }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup ao desmontar
    return () => {
      logger.debug('Removendo canal de realtime', { userId: user.id }, 'USER_STATS_REALTIME');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  return {
    stats,
    isLoading,
    refetch: loadUserStats
  };
};
