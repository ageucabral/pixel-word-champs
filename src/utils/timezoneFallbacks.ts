
/**
 * Funções de fallback seguras para timezone
 * Para evitar crashes quando as funções principais falham
 */

import { logger } from '@/utils/logger';

export const safeFormatWeeklyPeriodPreview = (startDate: string, endDate: string): string => {
  try {
    if (!startDate && !endDate) return 'Período não configurado';
    if (!startDate || !endDate) return 'Datas incompletas';
    
    // Formato simples sem conversões complexas
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = start.toLocaleDateString('pt-BR');
    const endStr = end.toLocaleDateString('pt-BR');
    
    return `${startStr} - ${endStr}`;
  } catch (error) {
    logger.error('Erro ao formatar período semanal:', error, 'TIMEZONE_FALLBACKS');
    return 'Erro ao formatar período';
  }
};

export const safeValidateBrasiliaDateRange = (startDate: string, endDate: string): { isValid: boolean; error?: string } => {
  try {
    if (!startDate || !endDate) {
      return { isValid: false, error: 'Datas de início e fim são obrigatórias' };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'Datas inválidas' };
    }
    
    if (start >= end) {
      return { isValid: false, error: 'Data de início deve ser anterior à data de fim' };
    }
    
    return { isValid: true };
  } catch (error) {
    logger.error('Erro na validação de datas:', error, 'TIMEZONE_FALLBACKS');
    return { isValid: false, error: 'Erro na validação das datas' };
  }
};

export const safeGetCurrentBrasiliaTime = (): string => {
  try {
    const now = new Date();
    return now.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    logger.error('Erro ao obter horário atual:', error, 'TIMEZONE_FALLBACKS');
    return new Date().toLocaleString('pt-BR');
  }
};
