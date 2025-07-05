import { supabase } from '@/integrations/supabase/client';
import { User, ApiResponse } from '@/types';
import { createSuccessResponse, createErrorResponse, handleServiceError } from '@/utils/apiHelpers';
import { mapUserFromProfile } from '@/utils/userMapper';
import { logger } from '@/utils/logger';

// Cache local para perfil do serviço
const PROFILE_SERVICE_CACHE_KEY = 'profile_service_cache';
const SERVICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutos para cache do serviço

// Função para obter perfil do cache do serviço
const getServiceCachedProfile = (userId: string): any | null => {
  try {
    const cached = localStorage.getItem(PROFILE_SERVICE_CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp, userId: cachedUserId } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > SERVICE_CACHE_TTL;
    
    if (isExpired || cachedUserId !== userId) {
      localStorage.removeItem(PROFILE_SERVICE_CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

// Função para salvar perfil no cache do serviço
const setServiceCachedProfile = (profile: any, userId: string) => {
  try {
    const cacheData = {
      data: profile,
      timestamp: Date.now(),
      userId
    };
    localStorage.setItem(PROFILE_SERVICE_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Falhar silenciosamente se localStorage não estiver disponível
  }
};

class ProfileService {
  async getCurrentProfile(): Promise<ApiResponse<User>> {
    try {
      logger.debug('🔄 BUSCANDO PERFIL ATUAL (PROFILE SERVICE)', undefined, 'PROFILE_SERVICE');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('❌ USUÁRIO NÃO AUTENTICADO', undefined, 'PROFILE_SERVICE');
        throw new Error('Usuário não autenticado');
      }

      // Verificar cache do serviço primeiro
      const cachedProfile = getServiceCachedProfile(user.id);
      if (cachedProfile) {
        logger.info('📦 USANDO CACHE DO PROFILE SERVICE', { 
          userId: user.id,
          username: cachedProfile.username 
        }, 'PROFILE_SERVICE');
        
        const userData = mapUserFromProfile(cachedProfile, user);
        return createSuccessResponse(userData);
      }

      // Query otimizada com retry
      const maxRetries = 3;
      let lastError = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          logger.debug(`🔄 TENTATIVA ${attempt}/${maxRetries} - PROFILE SERVICE`, { 
            attempt,
            userId: user.id 
          }, 'PROFILE_SERVICE');

          const startTime = Date.now();
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

          const responseTime = Date.now() - startTime;

          if (error && error.code !== 'PGRST116') {
            logger.warn(`⚠️ ERRO NA TENTATIVA ${attempt}/${maxRetries}`, { 
              error: error.message,
              code: error.code,
              responseTime
            }, 'PROFILE_SERVICE');
            
            lastError = error;
            if (attempt < maxRetries) {
              // Delay antes da próxima tentativa
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
            throw error;
          }

          if (data) {
            // Verificar se dados estão completos
            const isComplete = data.username && 
                             data.experience_points !== undefined &&
                             data.total_score !== undefined;

            if (isComplete) {
              // Salvar no cache do serviço
              setServiceCachedProfile(data, user.id);
              
              const userData = mapUserFromProfile(data, user);
              logger.info('✅ PERFIL CARREGADO COM SUCESSO (PROFILE SERVICE)', { 
                userId: user.id, 
                username: data.username,
                experiencePoints: data.experience_points,
                responseTime,
                attempt
              }, 'PROFILE_SERVICE');
              
              return createSuccessResponse(userData);
            } else {
              logger.warn(`⚠️ PERFIL INCOMPLETO - TENTATIVA ${attempt}/${maxRetries}`, { 
                hasUsername: !!data.username,
                hasXP: data.experience_points !== undefined,
                hasScore: data.total_score !== undefined,
                attempt
              }, 'PROFILE_SERVICE');
              
              if (attempt === maxRetries) {
                // Na última tentativa, usar dados mesmo que incompletos
                const userData = mapUserFromProfile(data, user);
                return createSuccessResponse(userData);
              }
              
              // Tentar novamente
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          } else {
            logger.warn(`📝 PERFIL NÃO ENCONTRADO - TENTATIVA ${attempt}/${maxRetries}`, {
              attempt,
              responseTime
            }, 'PROFILE_SERVICE');
            
            if (attempt === maxRetries) {
              throw new Error('Perfil não encontrado');
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        } catch (attemptError) {
          logger.warn(`❌ ERRO NA TENTATIVA ${attempt}/${maxRetries}`, { 
            error: attemptError instanceof Error ? attemptError.message : 'Erro desconhecido',
            attempt
          }, 'PROFILE_SERVICE');
          
          lastError = attemptError;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw attemptError;
        }
      }

      throw lastError || new Error('Falha ao carregar perfil após tentativas');
    } catch (error) {
      logger.error('❌ ERRO CRÍTICO NO PROFILE SERVICE', { error }, 'PROFILE_SERVICE');
      return createErrorResponse(handleServiceError(error, 'PROFILE_GET'));
    }
  }

  async updateProfile(updates: Partial<{ username: string; avatar_url: string; phone: string; pix_key: string; pix_holder_name: string }>): Promise<ApiResponse<User>> {
    try {
      logger.info('Atualizando perfil do usuário', { updates }, 'PROFILE_SERVICE');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('Usuário não autenticado ao atualizar perfil', undefined, 'PROFILE_SERVICE');
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('id, username, avatar_url, total_score, games_played, experience_points, pix_key, pix_holder_name, phone, created_at, updated_at')
        .single();

      if (error) {
        logger.error('Erro ao atualizar perfil no banco', { error: error.message, userId: user.id }, 'PROFILE_SERVICE');
        throw error;
      }

      const userData = mapUserFromProfile(data, user);
      logger.info('Perfil atualizado com sucesso', { userId: user.id }, 'PROFILE_SERVICE');
      return createSuccessResponse(userData);
    } catch (error) {
      logger.error('Erro ao atualizar perfil', { error }, 'PROFILE_SERVICE');
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
