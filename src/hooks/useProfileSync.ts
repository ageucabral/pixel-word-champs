import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { profileService } from '@/services/profileService';
import { logger } from '@/utils/logger';

interface ProfileSyncState {
  isProfileIncomplete: boolean;
  isRefreshing: boolean;
  refreshCount: number;
  lastRefreshAt: Date | null;
}

export const useProfileSync = () => {
  const { user, isAuthenticated } = useAuth();
  const [syncState, setSyncState] = useState<ProfileSyncState>({
    isProfileIncomplete: false,
    isRefreshing: false,
    refreshCount: 0,
    lastRefreshAt: null
  });

  // Verificar se perfil está incompleto
  const isProfileIncomplete = useCallback((currentUser: any) => {
    if (!currentUser) return false;
    
    const missingData = [
      !currentUser.username || currentUser.username === 'Usuário',
      currentUser.experience_points === undefined || currentUser.experience_points === null,
      currentUser.total_score === undefined || currentUser.total_score === null
    ];

    const incomplete = missingData.some(missing => missing);
    
    if (incomplete) {
      logger.warn('🔍 PERFIL INCOMPLETO DETECTADO', {
        hasUsername: !!currentUser.username && currentUser.username !== 'Usuário',
        hasXP: currentUser.experience_points !== undefined && currentUser.experience_points !== null,
        hasScore: currentUser.total_score !== undefined && currentUser.total_score !== null,
        userId: currentUser.id
      }, 'PROFILE_SYNC');
    }

    return incomplete;
  }, []);

  // Função para refresh automático do perfil
  const refreshProfile = useCallback(async (silent = false) => {
    if (!isAuthenticated || syncState.isRefreshing) return false;

    if (!silent) {
      setSyncState(prev => ({ ...prev, isRefreshing: true }));
    }

    try {
      logger.info('🔄 INICIANDO REFRESH DE PERFIL', { 
        silent, 
        refreshCount: syncState.refreshCount + 1 
      }, 'PROFILE_SYNC');

      const response = await profileService.getCurrentProfile();
      
      if (response.success && response.data) {
        const isStillIncomplete = isProfileIncomplete(response.data);
        
        setSyncState(prev => ({
          ...prev,
          isProfileIncomplete: isStillIncomplete,
          refreshCount: prev.refreshCount + 1,
          lastRefreshAt: new Date(),
          isRefreshing: false
        }));

        logger.info('✅ REFRESH DE PERFIL CONCLUÍDO', { 
          stillIncomplete: isStillIncomplete,
          username: response.data.username,
          experiencePoints: response.data.experience_points
        }, 'PROFILE_SYNC');

        return !isStillIncomplete;
      } else {
        logger.error('❌ FALHA NO REFRESH DE PERFIL', { 
          error: response.error 
        }, 'PROFILE_SYNC');
        
        setSyncState(prev => ({ ...prev, isRefreshing: false }));
        return false;
      }
    } catch (error) {
      logger.error('❌ ERRO NO REFRESH DE PERFIL', { error }, 'PROFILE_SYNC');
      setSyncState(prev => ({ ...prev, isRefreshing: false }));
      return false;
    }
  }, [isAuthenticated, syncState.isRefreshing, syncState.refreshCount, isProfileIncomplete]);

  // Monitorar mudanças no usuário
  useEffect(() => {
    if (!user || !isAuthenticated) {
      setSyncState({
        isProfileIncomplete: false,
        isRefreshing: false,
        refreshCount: 0,
        lastRefreshAt: null
      });
      return;
    }

    const incomplete = isProfileIncomplete(user);
    setSyncState(prev => ({ ...prev, isProfileIncomplete: incomplete }));

    // Auto-refresh se perfil estiver incompleto (máximo 2 tentativas automáticas)
    if (incomplete && syncState.refreshCount < 2) {
      const timeoutId = setTimeout(() => {
        logger.info('🔄 AUTO-REFRESH: Tentando recarregar perfil incompleto', { 
          refreshCount: syncState.refreshCount 
        }, 'PROFILE_SYNC');
        refreshProfile(true);
      }, 2000); // Delay de 2 segundos

      return () => clearTimeout(timeoutId);
    }
  }, [user, isAuthenticated, isProfileIncomplete, refreshProfile, syncState.refreshCount]);

  // Função para refresh manual
  const manualRefresh = useCallback(async () => {
    logger.info('👆 REFRESH MANUAL SOLICITADO PELO USUÁRIO', undefined, 'PROFILE_SYNC');
    return await refreshProfile(false);
  }, [refreshProfile]);

  return {
    isProfileIncomplete: syncState.isProfileIncomplete,
    isRefreshing: syncState.isRefreshing,
    refreshCount: syncState.refreshCount,
    lastRefreshAt: syncState.lastRefreshAt,
    manualRefresh,
    canAutoRefresh: syncState.refreshCount < 2
  };
};