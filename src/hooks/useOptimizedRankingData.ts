import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager, deduplicateRequest, performanceMonitor } from '@/utils/performanceOptimizer';
import { logger } from '@/utils/logger';

interface RankingPlayer {
  pos: number;
  user_id: string;
  name: string;
  score: number;
}

interface PrizeConfig {
  position: number;
  prize_amount: number;
}

const CACHE_KEYS = {
  RANKING: 'ranking_data',
  PRIZES: 'prize_configs',
  USER_POSITION: 'user_position'
};

const CACHE_DURATION = {
  RANKING: 60000, // 1 minuto
  PRIZES: 300000, // 5 minutos
  USER_POSITION: 30000 // 30 segundos
};

export const useOptimizedRankingData = () => {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [prizeConfigs, setPrizeConfigs] = useState<PrizeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);

  // Função otimizada para carregar configurações de prêmios
  const loadPrizeConfigurations = useCallback(async () => {
    const cacheKey = CACHE_KEYS.PRIZES;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      setPrizeConfigs(cached);
      return cached;
    }

    try {
      performanceMonitor.mark('prizes-load-start');
      
      const { data, error } = await supabase
        .from('prize_configurations')
        .select('position, prize_amount')
        .eq('type', 'individual')
        .eq('active', true)
        .in('position', [1, 2, 3])
        .order('position', { ascending: true });

      if (error) {
        logger.error('Erro ao carregar prêmios', { error }, 'RANKING_DATA');
        throw error;
      }

      const prizes: PrizeConfig[] = (data || []).map(config => ({
        position: config.position!,
        prize_amount: Number(config.prize_amount) || 0
      }));

      setPrizeConfigs(prizes);
      cacheManager.set(cacheKey, prizes, CACHE_DURATION.PRIZES);
      
      performanceMonitor.measure('prizes-load-time', 'prizes-load-start');
      logger.info('Prêmios carregados e cacheados', { prizesCount: prizes.length }, 'RANKING_DATA');
      
      return prizes;
    } catch (err) {
      logger.error('Erro ao carregar configurações de prêmios', { error: err }, 'RANKING_DATA');
      // Prêmios padrão em caso de erro
      const defaultPrizes = [
        { position: 1, prize_amount: 100 },
        { position: 2, prize_amount: 50 },
        { position: 3, prize_amount: 25 }
      ];
      setPrizeConfigs(defaultPrizes);
      return defaultPrizes;
    }
  }, []);

  // Função otimizada para carregar ranking
  const loadRanking = useCallback(async () => {
    const cacheKey = CACHE_KEYS.RANKING;
    const cached = cacheManager.get(cacheKey);
    if (cached && !user?.id) {
      setRanking(cached);
      return cached;
    }

    return deduplicateRequest('ranking_load', async () => {
      performanceMonitor.mark('ranking-load-start');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, total_score')
        .gt('total_score', 0)
        .order('total_score', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Erro ao carregar ranking', { error }, 'RANKING_DATA');
        throw error;
      }

      const players: RankingPlayer[] = (data || []).map((profile, index) => ({
        pos: index + 1,
        user_id: profile.id,
        name: profile.username || 'Usuário',
        score: profile.total_score || 0
      }));

      setRanking(players);
      cacheManager.set(cacheKey, players, CACHE_DURATION.RANKING);
      
      performanceMonitor.measure('ranking-load-time', 'ranking-load-start');
      logger.info('Ranking carregado e cacheado', { playersCount: players.length }, 'RANKING_DATA');
      
      return players;
    });
  }, [user?.id]);

  // Função otimizada para carregar dados completos
  const loadAllData = useCallback(async () => {
    if (loadingRef.current) return;
    
    // Cancelar requisição anterior se ainda estiver em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    loadingRef.current = true;
    
    try {
      setIsLoading(true);
      setError(null);
      
      performanceMonitor.mark('all-data-load-start');
      
      // Carregar dados em paralelo para máxima eficiência
      const [rankingData] = await Promise.all([
        loadRanking(),
        loadPrizeConfigurations()
      ]);

      // Encontrar posição do usuário atual
      if (user?.id && rankingData) {
        const userRank = rankingData.find(p => p.user_id === user.id);
        const position = userRank?.pos || null;
        setUserPosition(position);
        
        if (position) {
          cacheManager.set(
            `${CACHE_KEYS.USER_POSITION}_${user.id}`, 
            position, 
            CACHE_DURATION.USER_POSITION
          );
        }
        
        if (userRank) {
          logger.info('Posição do usuário encontrada', { 
            position: userRank.pos, 
            score: userRank.score 
          }, 'RANKING_DATA');
        }
      }

      performanceMonitor.measure('all-data-load-time', 'all-data-load-start');
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        logger.error('Erro ao carregar dados do ranking', { error: err }, 'RANKING_DATA');
        setError('Erro ao carregar ranking');
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [user?.id, loadRanking, loadPrizeConfigurations]);

  // Refetch otimizado com cache invalidation
  const refetch = useCallback(() => {
    // Limpar cache relacionado
    cacheManager.clear('ranking');
    cacheManager.clear('prize');
    cacheManager.clear('user_position');
    
    loadAllData();
  }, [loadAllData]);

  // Carregar dados iniciais
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAllData();
    }, 100); // Pequeno delay para permitir que o usuário se estabilize

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user?.id, loadAllData]);

  // Configurar atualizações em tempo real otimizadas
  useEffect(() => {
    if (!user?.id) return;
    
    logger.debug('Configurando monitoramento em tempo real otimizado', undefined, 'RANKING_DATA');

    const profilesChannel = supabase
      .channel('profiles-ranking-changes-optimized')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          logger.debug('Mudança detectada nos perfis', { payload }, 'RANKING_DATA');
          
          // Invalidar cache e recarregar dados
          cacheManager.clear('ranking');
          
          // Debounced reload para evitar muitas atualizações
          setTimeout(() => {
            if (!loadingRef.current) {
              loadAllData();
            }
          }, 2000);
        }
      )
      .subscribe();

    // Atualização periódica otimizada - apenas se não estiver carregando
    const interval = setInterval(() => {
      if (!loadingRef.current) {
        logger.debug('Atualização periódica do ranking', undefined, 'RANKING_DATA');
        
        // Verificar se cache expirou antes de recarregar
        const cachedRanking = cacheManager.get(CACHE_KEYS.RANKING);
        if (!cachedRanking) {
          loadAllData();
        }
      }
    }, 60000); // 1 minuto

    return () => {
      logger.debug('Desconectando canais de tempo real', undefined, 'RANKING_DATA');
      supabase.removeChannel(profilesChannel);
      clearInterval(interval);
    };
  }, [user?.id, loadAllData]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ranking,
    userPosition,
    prizeConfigs,
    isLoading,
    error,
    refetch
  };
};