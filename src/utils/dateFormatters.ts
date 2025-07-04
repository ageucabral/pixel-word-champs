
/**
 * @deprecated Use brazilianDateFormatter.ts instead
 * Utilitários de formatação de data para exibição
 */

import { formatISOToBrazilian, formatBrazilianDateRange } from './brazilianDateFormatter';

/**
 * @deprecated Use formatISOToBrazilian from brazilianDateFormatter.ts
 * Formatar data YYYY-MM-DD para DD/MM/YYYY
 */
export const formatDateForDisplay = (dateString: string): string => {
  return formatISOToBrazilian(dateString);
};

/**
 * @deprecated Use formatBrazilianDateRange from brazilianDateFormatter.ts
 * Formatar período de datas para exibição
 */
export const formatDatePeriod = (startDate: string, endDate: string): string => {
  return formatBrazilianDateRange(startDate, endDate);
};
