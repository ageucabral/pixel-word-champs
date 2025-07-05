
import { useState, useEffect } from 'react';
import { WeeklyConfig } from '@/types/weeklyConfig';
import { WeeklyConfigService } from '@/services/weeklyConfigService';
import { useWeeklyConfigOperations } from './useWeeklyConfigOperations';
import { calculateNextDates } from '@/utils/weeklyConfigCalculations';
import { logger } from '@/utils/logger';

export const useWeeklyConfig = () => {
  const [activeConfig, setActiveConfig] = useState<WeeklyConfig | null>(null);
  const [scheduledConfigs, setScheduledConfigs] = useState<WeeklyConfig[]>([]);
  const [completedConfigs, setCompletedConfigs] = useState<WeeklyConfig[]>([]);
  const [lastCompletedConfig, setLastCompletedConfig] = useState<WeeklyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const operations = useWeeklyConfigOperations();

  const loadConfigurations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Carregar configurações em paralelo
      const [activeData, scheduledData, completedData] = await Promise.all([
        WeeklyConfigService.loadActiveConfig(),
        WeeklyConfigService.loadScheduledConfigs(),
        WeeklyConfigService.loadCompletedConfigs()
      ]);

      setActiveConfig(activeData);
      setScheduledConfigs(scheduledData);
      setCompletedConfigs(completedData);
      
      // Definir a última competição finalizada para uso como referência
      if (completedData.length > 0) {
        setLastCompletedConfig(completedData[0]);
      }

    } catch (err: any) {
      logger.error('Erro ao carregar configurações:', { err }, 'USE_WEEKLY_CONFIG');
      setError(err.message || 'Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleCompetition = async (startDate: string, endDate: string) => {
    const result = await WeeklyConfigService.scheduleCompetition(startDate, endDate);
    if (result.success) {
      await loadConfigurations();
    }
    return result;
  };

  const finalizeCompetition = async () => {
    const result = await operations.finalizeCompetition();
    if (result.success) {
      await loadConfigurations();
    }
    return result;
  };

  const updateCompetition = async (competitionId: string, startDate: string, endDate: string) => {
    const result = await operations.updateCompetition(competitionId, startDate, endDate);
    if (result.success) {
      await loadConfigurations();
    }
    return result;
  };

  const updateActiveCompetitionEndDate = async (competitionId: string, endDate: string) => {
    const result = await operations.updateActiveCompetitionEndDate(competitionId, endDate);
    if (result.success) {
      await loadConfigurations();
    }
    return result;
  };

  const deleteCompetition = async (competitionId: string) => {
    const result = await operations.deleteCompetition(competitionId);
    if (result.success) {
      await loadConfigurations();
    }
    return result;
  };

  const getCalculatedNextDates = () => {
    return calculateNextDates(scheduledConfigs, activeConfig, lastCompletedConfig);
  };

  useEffect(() => {
    loadConfigurations();
  }, []);

  return {
    activeConfig,
    scheduledConfigs,
    completedConfigs,
    lastCompletedConfig,
    isLoading,
    error,
    loadConfigurations,
    scheduleCompetition,
    updateCompetition,
    updateActiveCompetitionEndDate,
    deleteCompetition,
    finalizeCompetition,
    calculateNextDates: getCalculatedNextDates
  };
};
