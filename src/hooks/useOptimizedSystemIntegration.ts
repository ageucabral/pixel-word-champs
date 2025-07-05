// ETAPA 4: INTEGRAÇÃO COMPLETA DO SISTEMA DE MONITORAMENTO OTIMIZADO
// Hook unificado para integrar todos os sistemas de otimização

import { useState, useEffect, useCallback, useRef } from 'react';
import { useOptimizedSystemHealth } from './useOptimizedSystemMonitoring';
import { initializeCacheWarming, getUnifiedSystemMetrics } from '@/utils/cacheWarming';
import { logger } from '@/utils/logger';

interface SystemIntegrationState {
  isInitialized: boolean;
  healthData: any;
  cacheMetrics: any;
  performanceData: any;
  lastUpdate: Date;
  errors: string[];
}

interface SystemIntegrationResult extends SystemIntegrationState {
  refresh: () => void;
  reinitialize: () => void;
  getSystemStatus: () => 'healthy' | 'warning' | 'critical';
  isLoading: boolean;
}

export const useOptimizedSystemIntegration = (): SystemIntegrationResult => {
  const [state, setState] = useState<SystemIntegrationState>({
    isInitialized: false,
    healthData: null,
    cacheMetrics: null,
    performanceData: null,
    lastUpdate: new Date(),
    errors: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const initializationRef = useRef(false);
  
  // Hook de saúde do sistema otimizado
  const { 
    data: healthData, 
    loading: healthLoading, 
    error: healthError, 
    refresh: refreshHealth 
  } = useOptimizedSystemHealth();

  // Inicialização completa do sistema
  const initializeSystem = useCallback(async () => {
    if (initializationRef.current) return;
    
    try {
      setIsLoading(true);
      logger.info('🚀 ETAPA 4 - Inicializando integração completa do sistema', {}, 'SYSTEM_INTEGRATION');
      
      // 1. Inicializar cache warming
      initializeCacheWarming();
      
      // 2. Obter métricas iniciais
      const cacheMetrics = await getUnifiedSystemMetrics();
      
      // 3. Configurar performance monitoring
      const performanceData = {
        initialized: true,
        timestamp: new Date(),
        status: 'active'
      };
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        cacheMetrics,
        performanceData,
        lastUpdate: new Date(),
        errors: []
      }));
      
      initializationRef.current = true;
      
      logger.info('✅ ETAPA 4 - Sistema integrado inicializado com sucesso', {
        cacheMetrics,
        performanceData
      }, 'SYSTEM_INTEGRATION');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na inicialização';
      
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, errorMessage]
      }));
      
      logger.error('❌ ETAPA 4 - Erro na inicialização do sistema integrado', {
        error,
        errorMessage
      }, 'SYSTEM_INTEGRATION');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Atualizar dados do sistema
  const updateSystemData = useCallback(async () => {
    try {
      // Obter métricas atualizadas
      const cacheMetrics = await getUnifiedSystemMetrics();
      
      setState(prev => ({
        ...prev,
        healthData,
        cacheMetrics,
        lastUpdate: new Date(),
        errors: healthError ? [healthError] : []
      }));
      
      logger.debug('🔄 ETAPA 4 - Dados do sistema atualizados', {
        hasHealthData: !!healthData,
        hasCacheMetrics: !!cacheMetrics,
        healthError
      }, 'SYSTEM_INTEGRATION');
      
    } catch (error) {
      logger.error('❌ Erro ao atualizar dados do sistema', { error }, 'SYSTEM_INTEGRATION');
    }
  }, [healthData, healthError]);

  // Função para obter status geral do sistema
  const getSystemStatus = useCallback((): 'healthy' | 'warning' | 'critical' => {
    if (state.errors.length > 0) return 'critical';
    if (!state.isInitialized) return 'warning';
    if (healthError) return 'critical';
    if (!healthData) return 'warning';
    
    // Verificar status da saúde do sistema
    if (healthData?.status === 'critical') return 'critical';
    if (healthData?.status === 'warning') return 'warning';
    
    return 'healthy';
  }, [state.errors, state.isInitialized, healthError, healthData]);

  // Função de refresh completo
  const refresh = useCallback(() => {
    logger.info('🔄 ETAPA 4 - Refresh completo do sistema solicitado', {}, 'SYSTEM_INTEGRATION');
    refreshHealth();
    updateSystemData();
  }, [refreshHealth, updateSystemData]);

  // Função de reinicialização
  const reinitialize = useCallback(() => {
    logger.info('🔄 ETAPA 4 - Reinicialização do sistema solicitada', {}, 'SYSTEM_INTEGRATION');
    initializationRef.current = false;
    setState({
      isInitialized: false,
      healthData: null,
      cacheMetrics: null,
      performanceData: null,
      lastUpdate: new Date(),
      errors: []
    });
    initializeSystem();
  }, [initializeSystem]);

  // Inicialização automática
  useEffect(() => {
    initializeSystem();
  }, [initializeSystem]);

  // Atualização automática quando dados de saúde mudam
  useEffect(() => {
    if (!healthLoading && state.isInitialized) {
      updateSystemData();
    }
  }, [healthData, healthError, healthLoading, state.isInitialized, updateSystemData]);

  // Log periódico do status (desenvolvimento)
  useEffect(() => {
    if (state.isInitialized) {
      const interval = setInterval(() => {
        const status = getSystemStatus();
        logger.debug('📊 ETAPA 4 - Status periódico do sistema', {
          status,
          lastUpdate: state.lastUpdate,
          errorsCount: state.errors.length,
          hasHealthData: !!state.healthData,
          hasCacheMetrics: !!state.cacheMetrics
        }, 'SYSTEM_INTEGRATION');
      }, 30000); // A cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [state.isInitialized, state.lastUpdate, state.errors.length, state.healthData, state.cacheMetrics, getSystemStatus]);

  return {
    ...state,
    refresh,
    reinitialize,
    getSystemStatus,
    isLoading: isLoading || healthLoading
  };
};

// Hook simplificado para verificação rápida de status
export const useSystemStatus = () => {
  const { getSystemStatus, isLoading, errors } = useOptimizedSystemIntegration();
  
  return {
    status: getSystemStatus(),
    isLoading,
    hasErrors: errors.length > 0,
    errorCount: errors.length
  };
};

// Hook para métricas específicas (para dashboard admin)
export const useSystemMetrics = () => {
  const { healthData, cacheMetrics, performanceData, lastUpdate } = useOptimizedSystemIntegration();
  
  return {
    health: healthData,
    cache: cacheMetrics,
    performance: performanceData,
    lastUpdate,
    isStale: lastUpdate && (Date.now() - lastUpdate.getTime()) > 5 * 60 * 1000 // 5 minutos
  };
};