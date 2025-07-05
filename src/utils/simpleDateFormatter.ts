
/**
 * Formatador de datas simples - SEM conversões de timezone
 * Para datas em formato ISO (YYYY-MM-DD) que não precisam de conversão
 */

import { logger } from '@/utils/logger';

/**
 * Formata data simples ISO (YYYY-MM-DD) para DD/MM/YYYY
 * SEM aplicar conversões de timezone
 */
export const formatSimpleDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    // Para datas em formato ISO (YYYY-MM-DD), fazer parsing direto
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      
      return `${day}/${month}/${year}`;
    }
    
    // Fallback para outros formatos
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    logger.error('Erro ao formatar data simples:', error, 'SIMPLE_DATE_FORMATTER');
    return '';
  }
};

/**
 * Formata período de datas (start - end)
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return '';
  
  const start = formatSimpleDate(startDate);
  const end = formatSimpleDate(endDate);
  
  return `${start} - ${end}`;
};
