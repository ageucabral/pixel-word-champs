/**
 * Formatador de datas brasileiro centralizado
 * Garante que todas as datas sejam exibidas no formato DD/MM/YYYY para o usuário
 * Enquanto mantém o formato ISO (YYYY-MM-DD) no banco de dados
 */

import { logger } from '@/utils/logger';

/**
 * Converte qualquer formato de data para o formato brasileiro DD/MM/YYYY
 * @param dateInput - String de data (ISO, UTC, etc.) ou objeto Date
 * @returns String formatada como DD/MM/YYYY
 */
export const formatToBrazilianDate = (dateInput: string | Date): string => {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      logger.warn('Data inválida fornecida:', dateInput, 'BRAZILIAN_DATE_FORMATTER');
      return '';
    }
    
    // Usar toLocaleDateString com configuração brasileira
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    logger.error('Erro ao formatar data:', error, 'BRAZILIAN_DATE_FORMATTER');
    return '';
  }
};

/**
 * Converte data e hora para formato brasileiro DD/MM/YYYY HH:mm
 * @param dateInput - String de data/hora ou objeto Date
 * @returns String formatada como DD/MM/YYYY HH:mm
 */
export const formatToBrazilianDateTime = (dateInput: string | Date): string => {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      logger.warn('Data/hora inválida fornecida:', dateInput, 'BRAZILIAN_DATE_FORMATTER');
      return '';
    }
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    logger.error('Erro ao formatar data/hora:', error, 'BRAZILIAN_DATE_FORMATTER');
    return '';
  }
};

/**
 * Formata período de datas no formato brasileiro
 * @param startDate - Data de início
 * @param endDate - Data de fim
 * @returns String no formato "DD/MM/YYYY - DD/MM/YYYY"
 */
export const formatBrazilianDateRange = (startDate: string | Date, endDate: string | Date): string => {
  const start = formatToBrazilianDate(startDate);
  const end = formatToBrazilianDate(endDate);
  
  if (!start || !end) return '';
  
  return `${start} - ${end}`;
};

/**
 * Converte data ISO (YYYY-MM-DD) para formato brasileiro sem conversão de timezone
 * Útil para datas que já estão no formato correto mas precisam ser exibidas em PT-BR
 * @param isoDate - Data no formato YYYY-MM-DD
 * @returns String formatada como DD/MM/YYYY
 */
export const formatISOToBrazilian = (isoDate: string): string => {
  if (!isoDate) return '';
  
  try {
    // Se a data inclui hora, extrair apenas a parte da data
    const dateOnly = isoDate.includes('T') ? isoDate.split('T')[0] : isoDate;
    
    // Verificar se está no formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      // Se não estiver no formato ISO, usar formatação normal
      return formatToBrazilianDate(isoDate);
    }
    
    // Converter YYYY-MM-DD para DD/MM/YYYY
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  } catch (error) {
    logger.error('Erro ao converter data ISO:', error, 'BRAZILIAN_DATE_FORMATTER');
    return formatToBrazilianDate(isoDate); // Fallback
  }
};

// Aliases para compatibilidade com código existente
export const formatDateForDisplay = formatISOToBrazilian;
export const formatBrazilianDate = formatToBrazilianDate;
export const formatDateBR = formatToBrazilianDate;
export const formatDateTimeBR = formatToBrazilianDateTime;