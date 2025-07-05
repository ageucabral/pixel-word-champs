
import { supabase } from '@/integrations/supabase/client';
import { WeeklyConfig } from '@/types/weeklyConfig';
import { logger } from '@/utils/logger';

export interface DateOverlapValidationResult {
  hasOverlap: boolean;
  conflictingCompetition?: {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  errorMessage?: string;
}

export const checkDateOverlap = async (
  startDate: string,
  endDate: string,
  excludeCompetitionId?: string
): Promise<DateOverlapValidationResult> => {
  try {
    // Buscar todas as competições ativas e agendadas
    let query = supabase
      .from('weekly_config')
      .select('id, start_date, end_date, status')
      .in('status', ['active', 'scheduled']);

    // Excluir a competição atual se estivermos editando
    if (excludeCompetitionId) {
      query = query.neq('id', excludeCompetitionId);
    }

    const { data: competitions, error } = await query;

    if (error) {
      logger.error('Erro ao buscar competições:', error, 'DATE_OVERLAP_VALIDATION');
      return {
        hasOverlap: false,
        errorMessage: 'Erro ao verificar sobreposições'
      };
    }

    if (!competitions || competitions.length === 0) {
      return { hasOverlap: false };
    }

    // Verificar sobreposição com cada competição existente
    for (const competition of competitions) {
      const compStart = competition.start_date;
      const compEnd = competition.end_date;

      // Verificar se há sobreposição
      // Duas faixas de datas se sobrepõem se:
      // - startDate <= compEnd E endDate >= compStart
      if (startDate <= compEnd && endDate >= compStart) {
        return {
          hasOverlap: true,
          conflictingCompetition: competition,
          errorMessage: `As datas se sobrepõem com a competição ${competition.status === 'active' ? 'ativa' : 'agendada'} (${compStart} a ${compEnd})`
        };
      }
    }

    return { hasOverlap: false };
  } catch (error) {
    logger.error('Erro na validação de sobreposição:', error, 'DATE_OVERLAP_VALIDATION');
    return {
      hasOverlap: false,
      errorMessage: 'Erro ao verificar sobreposições'
    };
  }
};

export const formatDateForDisplay = (dateString: string): string => {
  return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
};
