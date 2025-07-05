
import { useState, useEffect } from 'react';
import { useWeeklyConfig } from './useWeeklyConfig';
import { useWeeklyCompetitionActivation } from './useWeeklyCompetitionActivation';
import { useWeeklyCompetitionHistory } from './useWeeklyCompetitionHistory';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

export const useWeeklyConfigModal = (onConfigUpdated: () => void) => {
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const {
    activeConfig,
    scheduledConfigs,
    completedConfigs,
    lastCompletedConfig,
    isLoading: configsLoading,
    loadConfigurations,
    scheduleCompetition,
    finalizeCompetition,
    calculateNextDates
  } = useWeeklyConfig();

  // Usar o histórico real de competições semanais
  const {
    historyData: weeklyHistoryData,
    isLoading: historyLoading,
    totalPages: historyTotalPages,
    refetch: refetchHistory
  } = useWeeklyCompetitionHistory(historyPage, 5);

  const { activateWeeklyCompetitions, isActivating } = useWeeklyCompetitionActivation();

  // Calcular próximas datas automaticamente
  useEffect(() => {
    const nextDates = calculateNextDates();
    setNewStartDate(nextDates.startDate);
    setNewEndDate(nextDates.endDate);
  }, [scheduledConfigs, activeConfig, lastCompletedConfig]);

  const handleActivateCompetitions = async () => {
    logger.info('🎯 Ativando competições semanais manualmente', {
      timestamp: getCurrentBrasiliaTime()
    }, 'USE_WEEKLY_CONFIG_MODAL');

    const result = await activateWeeklyCompetitions();
    
    if (result.success) {
      logger.info('✅ Competições ativadas com sucesso:', result.data, 'USE_WEEKLY_CONFIG_MODAL');
      await loadConfigurations();
      await refetchHistory();
      onConfigUpdated();
    } else {
      logger.error('❌ Erro ao ativar competições:', { error: result.error }, 'USE_WEEKLY_CONFIG_MODAL');
    }
  };

  const handleScheduleNew = async () => {
    if (!newStartDate || !newEndDate) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await scheduleCompetition(newStartDate, newEndDate);
      
      if (result.success) {
        logger.info('✅ Nova competição agendada com sucesso', {}, 'USE_WEEKLY_CONFIG_MODAL');
        await loadConfigurations();
        await refetchHistory();
        onConfigUpdated();
      } else {
        logger.error('❌ Erro ao agendar competição:', { error: result.error }, 'USE_WEEKLY_CONFIG_MODAL');
      }
    } catch (error) {
      logger.error('❌ Erro ao agendar competição:', { error }, 'USE_WEEKLY_CONFIG_MODAL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    setIsLoading(true);
    try {
      logger.info('🏁 Finalizando competição semanal manualmente', {
        timestamp: getCurrentBrasiliaTime()
      }, 'USE_WEEKLY_CONFIG_MODAL');

      const result = await finalizeCompetition();
      
      if (result.success) {
        logger.info('✅ Competição finalizada com sucesso:', result.data, 'USE_WEEKLY_CONFIG_MODAL');
        await loadConfigurations();
        await refetchHistory();
        onConfigUpdated();
      } else {
        logger.error('❌ Erro ao finalizar competição:', { error: result.error }, 'USE_WEEKLY_CONFIG_MODAL');
      }
    } catch (error) {
      logger.error('❌ Erro ao finalizar competição:', { error }, 'USE_WEEKLY_CONFIG_MODAL');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Estados
    activeConfig,
    scheduledConfigs,
    completedConfigs,
    lastCompletedConfig,
    configsLoading,
    isActivating,
    isLoading,
    selectedCompetition,
    newStartDate,
    newEndDate,
    
    // Histórico - agora usando dados reais
    weeklyHistoryData: { data: weeklyHistoryData, totalCount: weeklyHistoryData.length },
    historyLoading,
    historyPage,
    historyTotalPages,
    
    // Ações
    setSelectedCompetition,
    setNewStartDate,
    setNewEndDate,
    setHistoryPage,
    handleActivateCompetitions,
    handleScheduleNew,
    handleFinalize,
    loadConfigurations,
    refetchHistory
  };
};
