import { logger } from '@/utils/logger';

// Configurações do cache
const CACHE_KEY = 'cached_profile';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

export interface CachedProfile {
  data: any;
  timestamp: number;
  userId: string;
}

// Função para obter perfil do cache
export const getCachedProfile = (userId?: string): any | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const cachedData: CachedProfile = JSON.parse(cached);
    const isExpired = Date.now() - cachedData.timestamp > CACHE_TTL;
    
    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      logger.debug('🗑️ CACHE EXPIRADO E REMOVIDO', { 
        userId: cachedData.userId,
        age: Date.now() - cachedData.timestamp 
      }, 'PROFILE_CACHE');
      return null;
    }

    // Verificar se é do usuário correto
    if (userId && cachedData.userId !== userId) {
      logger.debug('🔄 CACHE DE USUÁRIO DIFERENTE', { 
        cachedUserId: cachedData.userId,
        requestedUserId: userId 
      }, 'PROFILE_CACHE');
      return null;
    }
    
    logger.debug('📦 PERFIL OBTIDO DO CACHE', { 
      userId: cachedData.userId,
      age: Date.now() - cachedData.timestamp 
    }, 'PROFILE_CACHE');
    
    return cachedData.data;
  } catch (error) {
    logger.warn('⚠️ ERRO AO LER CACHE', { error }, 'PROFILE_CACHE');
    return null;
  }
};

// Função para salvar perfil no cache
export const setCachedProfile = (profile: any, userId: string) => {
  try {
    const cacheData: CachedProfile = {
      data: profile,
      timestamp: Date.now(),
      userId
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    
    logger.debug('💾 PERFIL SALVO NO CACHE', { 
      userId,
      username: profile.username 
    }, 'PROFILE_CACHE');
  } catch (error) {
    logger.warn('⚠️ ERRO AO SALVAR CACHE', { error }, 'PROFILE_CACHE');
  }
};

// Função para limpar cache
export const clearProfileCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    logger.debug('🗑️ CACHE LIMPO MANUALMENTE', undefined, 'PROFILE_CACHE');
  } catch (error) {
    logger.warn('⚠️ ERRO AO LIMPAR CACHE', { error }, 'PROFILE_CACHE');
  }
};

// Função para verificar se cache está válido
export const isCacheValid = (userId?: string): boolean => {
  const cached = getCachedProfile(userId);
  return cached !== null;
};