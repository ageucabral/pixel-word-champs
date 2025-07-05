

import { Json } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';

// Interface para Winner conforme usado no código
interface Winner {
  user_id: string;
  username: string;
  position: number;
  total_score: number;
  prize_amount: number;
  pix_key?: string;
  pix_holder_name?: string;
  payment_status: string;
}

// Interface para FinalizeResult conforme usado no código
interface FinalizeResult {
  success: boolean;
  error?: string;
  winners_count?: number;
  snapshot_id?: string;
  finalized_competition?: any;
  activated_competition?: any;
  profiles_reset?: number;
}

// Type guard para verificar se um objeto é um Winner válido
function isWinner(obj: any): obj is Winner {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.user_id === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.position === 'number' &&
    typeof obj.total_score === 'number' &&
    typeof obj.prize_amount === 'number' &&
    typeof obj.payment_status === 'string'
  );
}

// Type guard para verificar se um objeto é um FinalizeResult válido
function isFinalizeResult(obj: any): obj is FinalizeResult {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean'
  );
}

// Função para parsing seguro de array de Winners
export function parseWinnersData(data: Json | Json[]): Winner[] {
  try {
    if (Array.isArray(data)) {
      // Filtrar e converter com conversão dupla para evitar erro TypeScript
      const filtered = data.filter(isWinner);
      return (filtered as unknown) as Winner[];
    }
    return [];
  } catch (error) {
    logger.error('Erro ao fazer parse dos dados de ganhadores:', error, 'TYPE_GUARDS');
    return [];
  }
}

// Função para parsing seguro de rankings data
export function parseRankingsData(data: Json | Json[]): any[] {
  try {
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    logger.error('Erro ao fazer parse dos dados de ranking:', error, 'TYPE_GUARDS');
    return [];
  }
}

// Função para parsing seguro de FinalizeResult
export function parseFinalizeResult(data: Json): FinalizeResult {
  try {
    const obj = data as unknown;
    if (isFinalizeResult(obj)) {
      return obj;
    }
    
    // Se não é um FinalizeResult válido, retornar objeto de erro
    return {
      success: false,
      error: 'Dados de resposta inválidos'
    };
  } catch (error) {
    logger.error('Erro ao fazer parse do resultado de finalização:', error, 'TYPE_GUARDS');
    return {
      success: false,
      error: 'Erro ao processar resposta'
    };
  }
}

export type { Winner, FinalizeResult };

