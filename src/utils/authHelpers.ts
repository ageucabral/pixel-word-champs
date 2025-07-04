
import { User } from '@/types';
import { logger } from '@/utils/logger';

export const createFallbackUser = (session: any): User => {
  if (!session?.user) {
    logger.error('Sessão inválida para criar usuário fallback', { hasSession: !!session }, 'AUTH_HELPERS');
    throw new Error('Sessão inválida para criar usuário fallback');
  }

  logger.debug('👤 Criando usuário fallback otimizado', { 
    userId: session.user.id,
    email: session.user.email,
    hasUserMetadata: !!session.user.user_metadata
  }, 'AUTH_HELPERS');

  // Tentar obter dados do cache primeiro
  const cachedProfile = getCachedProfile();
  const useCache = cachedProfile && cachedProfile.id === session.user.id;

  const fallbackUser: User = {
    id: session.user.id,
    username: useCache ? cachedProfile.username : (
      session.user.user_metadata?.username || 
      session.user.email?.split('@')[0] || 
      'Usuário'
    ),
    email: session.user.email || '',
    created_at: session.user.created_at || new Date().toISOString(),
    updated_at: session.user.updated_at || new Date().toISOString(),
    total_score: useCache ? cachedProfile.total_score : 0,
    games_played: useCache ? cachedProfile.games_played : 0,
    // XP do cache se disponível, senão 0 - deve vir da base de dados
    experience_points: useCache ? cachedProfile.experience_points : 0,
    // Campos adicionais do cache se disponível
    avatar_url: useCache ? cachedProfile.avatar_url : undefined,
    pix_key: useCache ? cachedProfile.pix_key : undefined,
    pix_holder_name: useCache ? cachedProfile.pix_holder_name : undefined,
    phone: useCache ? cachedProfile.phone : undefined,
    best_daily_position: useCache ? cachedProfile.best_daily_position : undefined,
    best_weekly_position: useCache ? cachedProfile.best_weekly_position : undefined
  };

  logger.info('✅ Usuário fallback criado', { 
    userId: fallbackUser.id, 
    username: fallbackUser.username,
    email: fallbackUser.email,
    fromCache: useCache,
    experiencePoints: fallbackUser.experience_points
  }, 'AUTH_HELPERS');

  return fallbackUser;
};

// Cache local para fallback users - função de utilidade
const getCachedProfile = (): any | null => {
  try {
    const cached = localStorage.getItem('cached_profile');
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > (24 * 60 * 60 * 1000); // 24h
    
    if (isExpired) {
      localStorage.removeItem('cached_profile');
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

export const createTimeoutPromise = (timeoutMs: number): Promise<never> => {
  return new Promise((_, reject) => 
    setTimeout(() => {
      logger.warn('⏰ Timeout de operação atingido', { 
        timeoutMs,
        timeoutSeconds: timeoutMs / 1000,
        timestamp: new Date().toISOString()
      }, 'AUTH_HELPERS');
      reject(new Error(`Timeout após ${timeoutMs / 1000}s - operação cancelada`));
    }, timeoutMs)
  );
};
