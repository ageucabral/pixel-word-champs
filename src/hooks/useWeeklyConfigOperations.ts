
import { supabase } from '@/integrations/supabase/client';
import { WeeklyConfigRpcResponse, isWeeklyConfigRpcResponse } from '@/types/weeklyConfig';
import { parseFinalizeResult } from '@/utils/typeGuards';
import { logger } from '@/utils/logger';

export const useWeeklyConfigOperations = () => {
  const updateCompetition = async (competitionId: string, startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase.rpc('update_scheduled_competition', {
        competition_id: competitionId,
        new_start_date: startDate,
        new_end_date: endDate
      });

      if (error) throw error;

      const response = data as unknown as WeeklyConfigRpcResponse;
      
      if (isWeeklyConfigRpcResponse(response) && response.success) {
        return { success: true, data: response };
      } else {
        throw new Error(response?.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      logger.error('Erro ao atualizar competição:', { err }, 'USE_WEEKLY_CONFIG_OPERATIONS');
      return { success: false, error: err.message };
    }
  };

  const updateActiveCompetitionEndDate = async (competitionId: string, endDate: string) => {
    try {
      const { data, error } = await supabase.rpc('update_active_competition_end_date', {
        competition_id: competitionId,
        new_end_date: endDate
      });

      if (error) throw error;

      const response = data as unknown as WeeklyConfigRpcResponse;
      
      if (isWeeklyConfigRpcResponse(response) && response.success) {
        return { success: true, data: response };
      } else {
        throw new Error(response?.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      logger.error('Erro ao atualizar data de fim da competição ativa:', { err }, 'USE_WEEKLY_CONFIG_OPERATIONS');
      return { success: false, error: err.message };
    }
  };

  const deleteCompetition = async (competitionId: string) => {
    try {
      const { data, error } = await supabase.rpc('delete_scheduled_competition', {
        competition_id: competitionId
      });

      if (error) throw error;

      const response = data as unknown as WeeklyConfigRpcResponse;
      
      if (isWeeklyConfigRpcResponse(response) && response.success) {
        return { success: true, data: response };
      } else {
        throw new Error(response?.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      logger.error('Erro ao excluir competição:', { err }, 'USE_WEEKLY_CONFIG_OPERATIONS');
      return { success: false, error: err.message };
    }
  };

  const finalizeCompetition = async () => {
    try {
      const { data, error } = await supabase.rpc('finalize_weekly_competition');

      if (error) throw error;

      const result = parseFinalizeResult(data);
      
      if (result.success) {
        return { success: true, data: result };
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      logger.error('Erro ao finalizar competição:', { err }, 'USE_WEEKLY_CONFIG_OPERATIONS');
      return { success: false, error: err.message };
    }
  };

  return {
    updateCompetition,
    updateActiveCompetitionEndDate,
    deleteCompetition,
    finalizeCompetition
  };
};
