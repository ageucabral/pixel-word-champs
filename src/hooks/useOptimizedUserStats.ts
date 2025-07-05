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

// Cache para evitar re-fetches desnecessários
const statsCache = new Map<string, { data: UserStats; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minuto

export const useOptimizedUserStats = () => {
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
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadUserStats = useCallback(async () => {
    if (!user?.id || loadingRef.current) {
      return;
    }

    // Verificar cache primeiro
    const cacheKey = user.id;
    const cached = statsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setStats(cached.data);
      setIsLoading(false);
      return;
    }

    // Cancelar requisição anterior se ainda estiver em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      // Verificar sessão ativa com timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      );

      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

      if (!session?.user?.id || session.user.id !== user.id) {
        setIsLoading(false);
        loadingRef.current = false;
        return;
      }

      // Buscar perfil com single query otimizada
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, total_score, games_played, best_daily_position, best_weekly_position')
        .eq('id', user.id)
        .abortSignal(abortControllerRef.current.signal)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
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
          })
          .abortSignal(abortControllerRef.current.signal);
        
        if (!insertError) {
          const defaultStats = {
            position: null,
            totalScore: 0,
            gamesPlayed: 0,
            winStreak: 0,
            bestDailyPosition: null,
            bestWeeklyPosition: null
          };
          setStats(defaultStats);
          statsCache.set(cacheKey, { data: defaultStats, timestamp: Date.now() });
        }
        return;
      }

      // Calcular week_start para ranking semanal
      const today = getCurrentBrasiliaDate();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(today.setDate(diff));
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Calcular posição atual baseada na pontuação total
      let currentPosition = null;
      if (profile.total_score > 0) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('total_score', profile.total_score)
          .abortSignal(abortControllerRef.current.signal);
        
        currentPosition = (count || 0) + 1;
      }

      // Calcular streak de forma mais eficiente
      const sevenDaysAgo = getCurrentBrasiliaDate();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentSessions } = await Promise.race([
        supabase
          .from('game_sessions')
          .select('completed_at')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .gte('completed_at', createBrasiliaTimestamp(sevenDaysAgo.toString()))
          .abortSignal(abortControllerRef.current.signal)
          .limit(50),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sessions timeout')), 3000)
        )
      ]) as any;

      // Calcular streak de forma otimizada
      let streak = 0;
      if (recentSessions?.length) {
        const completedDates = new Set(
          recentSessions.map((session: any) => 
            new Date(session.completed_at).toDateString()
          )
        );

        for (let i = 0; i < 7; i++) {
          const checkDate = getCurrentBrasiliaDate();
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toDateString();
          
          if (completedDates.has(dateStr)) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
      }

      const userStats: UserStats = {
        position: currentPosition,
        totalScore: profile.total_score || 0,
        gamesPlayed: profile.games_played || 0,
        winStreak: streak,
        bestDailyPosition: profile.best_daily_position || null,
        bestWeeklyPosition: profile.best_weekly_position || null
      };

      setStats(userStats);
      
      // Atualizar cache
      statsCache.set(cacheKey, { data: userStats, timestamp: Date.now() });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        logger.warn('Erro ao carregar estatísticas do usuário:', { error }, 'USE_OPTIMIZED_USER_STATS');
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [user?.id, user?.username]);

  // Debounced loading com cleanup otimizado
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      loadUserStats();
    }, 100); // Reduced debounce time

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user?.id, loadUserStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    stats,
    isLoading,
    refetch: loadUserStats
  };
};