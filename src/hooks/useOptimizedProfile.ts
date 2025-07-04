import { useState, useEffect, useCallback } from 'react';
import { profileService } from '@/services/profileService';
import { User } from '@/types';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';

export const useOptimizedProfile = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  const fetchProfile = useCallback(async (silent = false) => {
    if (!isAuthenticated) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    try {
      logger.debug('🔄 BUSCANDO PERFIL OTIMIZADO', { 
        userId: user?.id,
        silent 
      }, 'OPTIMIZED_PROFILE');

      const response = await profileService.getCurrentProfile();
      
      if (response.success && response.data) {
        setProfile(response.data);
        setError(null);
        
        logger.info('✅ PERFIL OTIMIZADO CARREGADO', { 
          userId: response.data.id,
          username: response.data.username,
          experiencePoints: response.data.experience_points,
          silent
        }, 'OPTIMIZED_PROFILE');
      } else {
        setError(response.error || 'Erro ao carregar perfil');
        setProfile(null);
        
        logger.warn('⚠️ FALHA AO CARREGAR PERFIL OTIMIZADO', { 
          error: response.error,
          silent
        }, 'OPTIMIZED_PROFILE');
      }
    } catch (err) {
      setError('Erro ao carregar perfil do usuário');
      setProfile(null);
      
      logger.error('❌ ERRO NO PERFIL OTIMIZADO', { 
        error: err,
        silent
      }, 'OPTIMIZED_PROFILE');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, user?.id]);

  const updateProfile = async (updates: Partial<{ username: string; avatar_url: string; phone: string }>) => {
    try {
      logger.info('🔧 ATUALIZANDO PERFIL OTIMIZADO', { updates }, 'OPTIMIZED_PROFILE');

      const response = await profileService.updateProfile(updates);
      if (response.success && response.data) {
        setProfile(response.data);
        
        logger.info('✅ PERFIL ATUALIZADO COM SUCESSO', { 
          userId: response.data.id 
        }, 'OPTIMIZED_PROFILE');
        
        return { success: true };
      } else {
        logger.warn('⚠️ FALHA NA ATUALIZAÇÃO DO PERFIL', { 
          error: response.error 
        }, 'OPTIMIZED_PROFILE');
        
        return { success: false, error: response.error };
      }
    } catch (err) {
      logger.error('❌ ERRO NA ATUALIZAÇÃO DO PERFIL', { error: err }, 'OPTIMIZED_PROFILE');
      return { success: false, error: 'Erro ao atualizar perfil' };
    }
  };

  // Sincronizar com mudanças de autenticação
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Usar dados do auth como fallback inicial se não tiver perfil
  useEffect(() => {
    if (isAuthenticated && user && !profile && !isLoading) {
      logger.debug('🔄 USANDO DADOS DO AUTH COMO FALLBACK INICIAL', { 
        userId: user.id,
        username: user.username 
      }, 'OPTIMIZED_PROFILE');
      
      setProfile(user);
    }
  }, [isAuthenticated, user, profile, isLoading]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile
  };
};