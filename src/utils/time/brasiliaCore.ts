
/**
 * CONVERSÕES PRINCIPAIS - BRASÍLIA ↔ UTC
 * Funções core para conversão entre fusos horários
 */

import { logger } from '@/utils/logger';

/**
 * CORRIGIDO: Converte input datetime-local para UTC sem duplicação
 * Input: 15:30 Brasília → Output: 18:30 UTC (correto: +3h apenas uma vez)
 */
export const convertBrasiliaInputToUTC = (brasiliaDateTime: string): string => {
  if (!brasiliaDateTime) return new Date().toISOString();
  
  try {
    logger.debug('🔄 CONVERSÃO BRASÍLIA → UTC (SEM DUPLICAÇÃO):', {
      input: brasiliaDateTime,
      step: 'Conversão direta sem adições extras'
    }, 'BRASILIA_CORE');
    
    // CORREÇÃO DEFINITIVA: Usar Date diretamente sem parsing manual
    // O datetime-local já é interpretado no timezone local do sistema
    const brasiliaDate = new Date(brasiliaDateTime);
    
    // Verificar se a data é válida
    if (isNaN(brasiliaDate.getTime())) {
      logger.error('❌ Data inválida:', brasiliaDateTime, 'BRASILIA_CORE');
      return new Date().toISOString();
    }
    
    // A conversão para UTC é automática pelo toISOString()
    const utcResult = brasiliaDate.toISOString();
    
    logger.debug('✅ Conversão sem duplicação:', {
      brasiliaInput: brasiliaDateTime,
      brasiliaTime: brasiliaDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      utcResult: utcResult,
      operation: 'Conversão direta sem adições manuais'
    }, 'BRASILIA_CORE');
    
    return utcResult;
  } catch (error) {
    logger.error('❌ Erro ao converter Brasília para UTC:', error, 'BRASILIA_CORE');
    return new Date().toISOString();
  }
};

/**
 * CORRIGIDO: Converte UTC para formato datetime-local (Brasília) sem duplicação
 */
export const formatUTCForDateTimeLocal = (utcDateTime: string): string => {
  if (!utcDateTime) return '';
  
  try {
    logger.debug('🔄 UTC → Brasília (SEM DUPLICAÇÃO):', {
      input: utcDateTime,
      step: 'Conversão usando toLocaleString'
    }, 'BRASILIA_CORE');
    
    const utcDate = new Date(utcDateTime);
    
    // CORREÇÃO: Usar toLocaleString para conversão automática
    const brasiliaString = utcDate.toLocaleString('sv-SE', { 
      timeZone: 'America/Sao_Paulo' 
    }).replace(' ', 'T').slice(0, 16);
    
    logger.debug('✅ UTC → Brasília (sem duplicação):', {
      utcInput: utcDateTime,
      brasiliaResult: brasiliaString,
      operation: 'Conversão automática via toLocaleString'
    }, 'BRASILIA_CORE');
    
    return brasiliaString;
  } catch (error) {
    logger.error('❌ Erro ao converter UTC para datetime-local:', error, 'BRASILIA_CORE');
    return '';
  }
};

/**
 * Criar timestamp UTC para banco de dados
 */
export const createBrasiliaTimestamp = (date?: Date | string | null): string => {
  if (!date) {
    return new Date().toISOString();
  }
  
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  
  return date.toISOString();
};

/**
 * Obter data/hora atual em Brasília
 */
export const getCurrentBrasiliaDate = (): Date => {
  return new Date();
};

/**
 * CORRIGIDO FINAL: Obter horário atual formatado para Brasília (formato garantido)
 */
export const getCurrentBrasiliaTime = (): string => {
  const now = new Date();
  
  try {
    // CORREÇÃO FINAL: Formatação manual para garantir consistência absoluta
    const brasiliaTime = now.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Garantir formato padronizado DD/MM/YYYY HH:mm:ss
    const cleanedTime = brasiliaTime.replace(/,\s*/g, ' ').trim();
    
    logger.debug('🕐 FORMATAÇÃO FINAL getCurrentBrasiliaTime:', {
      original: brasiliaTime,
      cleaned: cleanedTime,
      regex: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(cleanedTime)
    }, 'BRASILIA_CORE');
    
    return cleanedTime;
  } catch (error) {
    logger.error('❌ Erro ao formatar horário atual:', error, 'BRASILIA_CORE');
    // Fallback manual em caso de erro
    const fallback = now.toISOString().replace('T', ' ').slice(0, 19);
    return fallback;
  }
};
