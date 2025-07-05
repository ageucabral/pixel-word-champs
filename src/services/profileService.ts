import { supabase } from '@/integrations/supabase/client';
import { User, ApiResponse } from '@/types';
import { createSuccessResponse, createErrorResponse, handleServiceError } from '@/utils/apiHelpers';
import { mapUserFromProfile } from '@/utils/userMapper';
import { logger } from '@/utils/logger';

// Cache simplificado para perfil do serviço
const CACHE_KEY = 'profile_cache';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

const getCache = (userId: string): any | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp, userId: cachedUserId } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_TTL;
    
    if (isExpired || cachedUserId !== userId) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

const setCache = (profile: any, userId: string) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: profile,
      timestamp: Date.now(),
      userId
    }));
  } catch {
    // Ignora erros de localStorage
  }
};

class ProfileService {
  async getCurrentProfile(): Promise<ApiResponse<User>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar cache primeiro
      const cachedProfile = getCache(user.id);
      if (cachedProfile) {
        const userData = mapUserFromProfile(cachedProfile, user);
        return createSuccessResponse(userData);
      }

      // Query simplificada sem retry excessivo
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          total_score,
          games_played,
          best_daily_position,
          best_weekly_position,
          pix_key,
          pix_holder_name,
          phone,
          experience_points,
          created_at,
          updated_at
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Salvar no cache
        setCache(data, user.id);
        const userData = mapUserFromProfile(data, user);
        return createSuccessResponse(userData);
      } else {
        throw new Error('Perfil não encontrado');
      }
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'PROFILE_GET'));
    }
  }

  async updateProfile(updates: Partial<{ username: string; avatar_url: string; phone: string; pix_key: string; pix_holder_name: string }>): Promise<ApiResponse<User>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('id, username, avatar_url, total_score, games_played, experience_points, pix_key, pix_holder_name, phone, created_at, updated_at')
        .single();

      if (error) {
        throw error;
      }

      // Limpar cache após atualização
      localStorage.removeItem(CACHE_KEY);
      
      const userData = mapUserFromProfile(data, user);
      return createSuccessResponse(userData);
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'PROFILE_UPDATE'));
    }
  }

  async getTopPlayers(limit = 10): Promise<ApiResponse<any[]>> {
    try {
      logger.debug('Buscando top players', { limit }, 'PROFILE_SERVICE');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, total_score, games_played')
        .order('total_score', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Erro ao buscar top players', { error: error.message }, 'PROFILE_SERVICE');
        throw error;
      }

      if (!data) {
        logger.warn('Nenhum dado encontrado para top players', undefined, 'PROFILE_SERVICE');
        return createErrorResponse('Nenhum dado encontrado');
      }

      logger.info('Top players carregados', { count: data.length }, 'PROFILE_SERVICE');
      return createSuccessResponse(data);
    } catch (error) {
      logger.error('Erro ao buscar top players', { error }, 'PROFILE_SERVICE');
      return createErrorResponse(handleServiceError(error, 'PROFILE_TOP_PLAYERS'));
    }
  }
}

export const profileService = new ProfileService();
