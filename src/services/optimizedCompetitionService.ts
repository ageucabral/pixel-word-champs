import { supabase } from '@/integrations/supabase/client';
import { 
  cacheManager, 
  deduplicateRequest, 
  createBatchProcessor,
  performanceMonitor 
} from '@/utils/performanceOptimizer';
import { logger } from '@/utils/logger';

interface Competition {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  type: string;
  prizePool?: number;
}

const CACHE_KEYS = {
  ACTIVE_COMPETITIONS: 'active_competitions',
  DAILY_COMPETITION: 'daily_competition',
  WEEKLY_COMPETITION: 'weekly_competition',
  COMPETITION_RANKING: 'competition_ranking'
};

const CACHE_DURATION = {
  COMPETITIONS: 120000, // 2 minutos
  RANKINGS: 60000, // 1 minuto
  DAILY: 300000, // 5 minutos
  WEEKLY: 600000 // 10 minutos
};

class OptimizedCompetitionService {
  private batchProcessor = createBatchProcessor<string>(
    (competitionIds) => this.batchLoadCompetitionData(competitionIds),
    100 // 100ms delay para batch
  );

  // Carregar competições ativas com cache inteligente
  async getActiveCompetitions() {
    const cacheKey = CACHE_KEYS.ACTIVE_COMPETITIONS;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) {
      logger.debug('Competições ativas retornadas do cache', { count: cached.length }, 'OPTIMIZED_COMPETITION_SERVICE');
      return { success: true, data: cached };
    }

    return deduplicateRequest('active_competitions', async () => {
      try {
        performanceMonitor.mark('competitions-load-start');
        
        // Query otimizada com índices apropriados
        const { data, error } = await supabase
          .from('custom_competitions')
          .select('id, title, description, status, start_date, end_date, competition_type, prize_pool')
          .in('status', ['active', 'scheduled'])
          .order('start_date', { ascending: true });

        if (error) {
          logger.error('Erro ao carregar competições ativas', { error }, 'OPTIMIZED_COMPETITION_SERVICE');
          throw error;
        }

        const competitions: Competition[] = (data || []).map(comp => ({
          id: comp.id,
          title: comp.title,
          description: comp.description,
          status: comp.status,
          startDate: comp.start_date,
          endDate: comp.end_date,
          type: comp.competition_type,
          prizePool: comp.prize_pool
        }));

        // Cache com TTL baseado no status das competições
        const hasActiveCompetition = competitions.some(c => c.status === 'active');
        const cacheDuration = hasActiveCompetition ? CACHE_DURATION.COMPETITIONS : CACHE_DURATION.WEEKLY;
        
        cacheManager.set(cacheKey, competitions, cacheDuration);
        
        performanceMonitor.measure('competitions-load-time', 'competitions-load-start');
        logger.info('Competições ativas carregadas e cacheadas', { 
          count: competitions.length,
          activeCount: competitions.filter(c => c.status === 'active').length 
        }, 'OPTIMIZED_COMPETITION_SERVICE');

        return { success: true, data: competitions };
        
      } catch (error) {
        logger.error('Erro ao carregar competições ativas', { error }, 'OPTIMIZED_COMPETITION_SERVICE');
        return { success: false, error: 'Erro ao carregar competições', data: [] };
      }
    });
  }

  // Carregar competição diária otimizada
  async getDailyCompetition() {
    const cacheKey = CACHE_KEYS.DAILY_COMPETITION;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) {
      logger.debug('Competição diária retornada do cache', { competitionId: cached.id }, 'OPTIMIZED_COMPETITION_SERVICE');
      return { success: true, data: cached };
    }

    return deduplicateRequest('daily_competition', async () => {
      try {
        performanceMonitor.mark('daily-competition-load-start');
        
        const { data, error } = await supabase
          .from('custom_competitions')
          .select('id, title, description, status, start_date, end_date, competition_type, prize_pool')
          .eq('competition_type', 'challenge')
          .eq('status', 'active')
          .order('start_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          logger.error('Erro ao carregar competição diária', { error }, 'OPTIMIZED_COMPETITION_SERVICE');
          throw error;
        }

        const competition = data ? {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status,
          startDate: data.start_date,
          endDate: data.end_date,
          type: data.competition_type,
          prizePool: data.prize_pool
        } : null;

        cacheManager.set(cacheKey, competition, CACHE_DURATION.DAILY);
        
        performanceMonitor.measure('daily-competition-load-time', 'daily-competition-load-start');
        logger.info('Competição diária carregada', { 
          found: !!competition,
          competitionId: competition?.id 
        }, 'OPTIMIZED_COMPETITION_SERVICE');

        return { success: true, data: competition };
        
      } catch (error) {
        logger.error('Erro ao carregar competição diária', { error }, 'OPTIMIZED_COMPETITION_SERVICE');
        return { success: false, error: 'Erro ao carregar competição diária', data: null };
      }
    });
  }

  // Carregar competição semanal otimizada
  async getWeeklyCompetition() {
    const cacheKey = CACHE_KEYS.WEEKLY_COMPETITION;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) {
      logger.debug('Competição semanal retornada do cache', { competitionId: cached?.id }, 'OPTIMIZED_COMPETITION_SERVICE');
      return { success: true, data: cached };
    }

    return deduplicateRequest('weekly_competition', async () => {
      try {
        performanceMonitor.mark('weekly-competition-load-start');
        
        const { data, error } = await supabase
          .from('custom_competitions')
          .select('id, title, description, status, start_date, end_date, competition_type, prize_pool')
          .eq('competition_type', 'tournament')
          .eq('status', 'active')
          .order('start_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          logger.error('Erro ao carregar competição semanal', { error }, 'OPTIMIZED_COMPETITION_SERVICE');
          throw error;
        }

        const competition = data ? {
          id: data.id,
          title: data.title,
          description: data.description,
          status: data.status,
          startDate: data.start_date,
          endDate: data.end_date,
          type: data.competition_type,
          prizePool: data.prize_pool
        } : null;

        cacheManager.set(cacheKey, competition, CACHE_DURATION.WEEKLY);
        
        performanceMonitor.measure('weekly-competition-load-time', 'weekly-competition-load-start');
        logger.info('Competição semanal carregada', { 
          found: !!competition,
          competitionId: competition?.id 
        }, 'OPTIMIZED_COMPETITION_SERVICE');

        return { success: true, data: competition };
        
      } catch (error) {
        logger.error('Erro ao carregar competição semanal', { error }, 'OPTIMIZED_COMPETITION_SERVICE');
        return { success: false, error: 'Erro ao carregar competição semanal', data: null };
      }
    });
  }

  // Participar em competição com validação otimizada
  async joinCompetition(competitionId: string) {
    try {
      performanceMonitor.mark('join-competition-start');
      
      logger.info('Tentativa de participar em competição', { competitionId }, 'OPTIMIZED_COMPETITION_SERVICE');
      
      // Invalidar caches relacionados após participação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      const result = await supabase
        .from('competition_participations')
        .insert({ 
          competition_id: competitionId,
          user_id: user.id 
        });

      if (result.error) {
        logger.error('Erro ao participar da competição', { error: result.error, competitionId }, 'OPTIMIZED_COMPETITION_SERVICE');
        throw result.error;
      }

      // Invalidar caches para forçar reload
      cacheManager.clear('competition_ranking');
      cacheManager.clear('active_competitions');
      
      performanceMonitor.measure('join-competition-time', 'join-competition-start');
      logger.info('Participação em competição bem-sucedida', { competitionId }, 'OPTIMIZED_COMPETITION_SERVICE');

      return { success: true };
      
    } catch (error) {
      logger.error('Erro ao participar da competição', { error, competitionId }, 'OPTIMIZED_COMPETITION_SERVICE');
      return { success: false, error: 'Erro ao participar da competição' };
    }
  }

  // Carregar ranking da competição com cache
  async getCompetitionRanking(competitionId: string) {
    const cacheKey = `${CACHE_KEYS.COMPETITION_RANKING}_${competitionId}`;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) {
      logger.debug('Ranking da competição retornado do cache', { competitionId }, 'OPTIMIZED_COMPETITION_SERVICE');
      return { success: true, data: cached };
    }

    return deduplicateRequest(`competition_ranking_${competitionId}`, async () => {
      try {
        performanceMonitor.mark('competition-ranking-load-start');
        
        const { data, error } = await supabase
          .from('competition_participations')
          .select(`
            user_id,
            user_score,
            user_position,
            profiles:user_id (username)
          `)
          .eq('competition_id', competitionId)
          .order('user_position', { ascending: true })
          .limit(100);

        if (error) {
          logger.error('Erro ao carregar ranking da competição', { error, competitionId }, 'OPTIMIZED_COMPETITION_SERVICE');
          throw error;
        }

        const ranking = (data || []).map(participation => ({
          userId: participation.user_id,
          username: 'Usuário',
          score: participation.user_score || 0,
          position: participation.user_position || 0
        }));

        cacheManager.set(cacheKey, ranking, CACHE_DURATION.RANKINGS);
        
        performanceMonitor.measure('competition-ranking-load-time', 'competition-ranking-load-start');
        logger.info('Ranking da competição carregado', { 
          competitionId, 
          participantsCount: ranking.length 
        }, 'OPTIMIZED_COMPETITION_SERVICE');

        return { success: true, data: ranking };
        
      } catch (error) {
        logger.error('Erro ao carregar ranking da competição', { error, competitionId }, 'OPTIMIZED_COMPETITION_SERVICE');
        return { success: false, error: 'Erro ao carregar ranking', data: [] };
      }
    });
  }

  // Batch loading para otimizar múltiplas requisições
  private async batchLoadCompetitionData(competitionIds: string[]) {
    try {
      performanceMonitor.mark('batch-competitions-load-start');
      
      const { data, error } = await supabase
        .from('custom_competitions')
        .select('*')
        .in('id', competitionIds);

      if (error) {
        logger.error('Erro no batch load de competições', { error, competitionIds }, 'OPTIMIZED_COMPETITION_SERVICE');
        throw error;
      }

      // Cache individual para cada competição
      data?.forEach(competition => {
        const cacheKey = `competition_${competition.id}`;
        cacheManager.set(cacheKey, competition, CACHE_DURATION.COMPETITIONS);
      });

      performanceMonitor.measure('batch-competitions-load-time', 'batch-competitions-load-start');
      logger.info('Batch load de competições concluído', { 
        requestedCount: competitionIds.length,
        loadedCount: data?.length || 0 
      }, 'OPTIMIZED_COMPETITION_SERVICE');

    } catch (error) {
      logger.error('Erro no batch load de competições', { error, competitionIds }, 'OPTIMIZED_COMPETITION_SERVICE');
    }
  }

  // Invalidar cache específico
  invalidateCache(type?: 'active' | 'daily' | 'weekly' | 'rankings') {
    switch (type) {
      case 'active':
        cacheManager.clear(CACHE_KEYS.ACTIVE_COMPETITIONS);
        break;
      case 'daily':
        cacheManager.clear(CACHE_KEYS.DAILY_COMPETITION);
        break;
      case 'weekly':
        cacheManager.clear(CACHE_KEYS.WEEKLY_COMPETITION);
        break;
      case 'rankings':
        cacheManager.clear('competition_ranking');
        break;
      default:
        // Limpar todos os caches de competições
        Object.values(CACHE_KEYS).forEach(key => {
          cacheManager.clear(key);
        });
        cacheManager.clear('competition_ranking');
        break;
    }
    
    logger.info('Cache de competições invalidado', { type }, 'OPTIMIZED_COMPETITION_SERVICE');
  }

  // Pré-carregamento inteligente
  async preloadCompetitions() {
    logger.debug('Iniciando pré-carregamento de competições', undefined, 'OPTIMIZED_COMPETITION_SERVICE');
    
    // Carregar em paralelo sem bloquear a UI
    Promise.all([
      this.getActiveCompetitions(),
      this.getDailyCompetition(),
      this.getWeeklyCompetition()
    ]).catch(error => {
      logger.error('Erro no pré-carregamento', { error }, 'OPTIMIZED_COMPETITION_SERVICE');
    });
  }
}

export const optimizedCompetitionService = new OptimizedCompetitionService();