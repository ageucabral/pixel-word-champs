
/**
 * CÁLCULOS DE TEMPO
 * Funções para calcular durações, períodos e tempo restante
 */

import { logger } from '@/utils/logger';

/**
 * CORRIGIDO: Calcula data de fim sem duplicação de timezone
 */
export const calculateEndDateWithDuration = (startDateTimeBrasilia: string, durationHours: number): string => {
  if (!startDateTimeBrasilia || !durationHours) {
    return '';
  }
  
  try {
    logger.debug('⏰ CÁLCULO DE FIM (SEM DUPLICAÇÃO):', {
      startInput: startDateTimeBrasilia,
      duration: durationHours
    }, 'BRASILIA_CALCULATIONS');
    
    // CORREÇÃO: Trabalhar diretamente com Date sem conversões manuais
    const startDate = new Date(startDateTimeBrasilia);
    
    // Calcular fim adicionando duração em milissegundos
    const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000));
    
    // Verificar limite do mesmo dia (23:59:59)
    const sameDayLimit = new Date(startDate);
    sameDayLimit.setHours(23, 59, 59, 999);
    
    const finalEndDate = endDate > sameDayLimit ? sameDayLimit : endDate;
    
    logger.debug('📊 Cálculo sem duplicação:', {
      startTime: startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      calculatedEnd: endDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      finalEnd: finalEndDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      wasLimited: endDate > sameDayLimit,
      durationUsed: durationHours
    }, 'BRASILIA_CALCULATIONS');
    
    // Converter resultado final para UTC
    const utcResult = finalEndDate.toISOString();
    
    logger.debug('✅ Resultado final (SEM DUPLICAÇÃO):', {
      brasiliaEnd: finalEndDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      utcEnd: utcResult,
      conversion: 'Conversão direta sem duplicação'
    }, 'BRASILIA_CALCULATIONS');
    
    return utcResult;
  } catch (error) {
    logger.error('❌ Erro ao calcular data de fim:', error, 'BRASILIA_CALCULATIONS');
    return '';
  }
};

/**
 * Calcular tempo restante em milissegundos
 */
export const calculateTimeRemaining = (endDateUTC: string): number => {
  if (!endDateUTC) return 0;
  
  try {
    const now = new Date();
    const end = new Date(endDateUTC);
    const diff = end.getTime() - now.getTime();
    
    return Math.max(0, diff);
  } catch (error) {
    logger.error('Erro ao calcular tempo restante:', error, 'BRASILIA_CALCULATIONS');
    return 0;
  }
};

/**
 * Calcular tempo restante formatado
 */
export const calculateTimeRemainingFormatted = (endDateUTC: string): string => {
  if (!endDateUTC) return '';
  
  try {
    const diff = calculateTimeRemaining(endDateUTC);
    
    if (diff <= 0) return 'Finalizado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  } catch (error) {
    logger.error('Erro ao calcular tempo restante:', error, 'BRASILIA_CALCULATIONS');
    return '';
  }
};
