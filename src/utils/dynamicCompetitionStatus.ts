
/**
 * UTILITÁRIOS SIMPLIFICADOS - CONFIAR NO BANCO DE DADOS
 * Apenas funções de formatação, sem cálculos de status
 */

import { logger } from '@/utils/logger';

export type CompetitionStatus = 'scheduled' | 'active' | 'completed';

/**
 * Converte status para texto em português
 */
export const getStatusText = (status: CompetitionStatus): string => {
  switch (status) {
    case 'active': return 'Ativo';
    case 'scheduled': return 'Agendado';
    case 'completed': return 'Finalizado';
    default: return 'Rascunho';
  }
};

/**
 * Converte status para classes CSS
 */
export const getStatusColor = (status: CompetitionStatus): string => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-200';
    case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

/**
 * Formatar data UTC para exibição em Brasília
 */
export const formatDateTimeBrasilia = (utcDateString: string): string => {
  try {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    return date.toLocaleString("pt-BR", { 
      timeZone: "America/Sao_Paulo",
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    logger.error('❌ Erro ao formatar data:', error, 'DYNAMIC_COMPETITION_STATUS');
    return 'Data inválida';
  }
};
