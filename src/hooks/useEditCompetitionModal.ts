
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { WeeklyConfig, WeeklyConfigRpcResponse, isWeeklyConfigRpcResponse } from '@/types/weeklyConfig';
import { checkDateOverlap } from '@/utils/dateOverlapValidation';
import { logger } from '@/utils/logger';

interface UseEditCompetitionModalProps {
  competition: WeeklyConfig | null;
  open: boolean;
  onSuccess: () => void;
  onOpenChange: (open: boolean) => void;
}

export const useEditCompetitionModal = ({
  competition,
  open,
  onSuccess,
  onOpenChange
}: UseEditCompetitionModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (competition && open) {
      setStartDate(competition.start_date);
      setEndDate(competition.end_date);
    }
  }, [competition, open]);

  const validateDates = async (start: string, end: string, isActive: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (isActive) {
      // Para competições ativas, apenas validar se a data de fim não está no passado
      if (end < today) {
        return "A data de fim não pode ser anterior ao dia de hoje";
      }
    } else {
      // Para competições agendadas, permitir start_date = end_date, mas não start_date > end_date
      if (start > end) {
        return "A data de início deve ser anterior ou igual à data de fim";
      }
      
      // Validar se as datas não estão no passado
      if (start < today) {
        return "A data de início não pode ser anterior ao dia de hoje";
      }
      
      if (end < today) {
        return "A data de fim não pode ser anterior ao dia de hoje";
      }
    }

    // Verificar sobreposição com outras competições
    const overlapResult = await checkDateOverlap(start, end, competition?.id);
    if (overlapResult.hasOverlap) {
      return overlapResult.errorMessage || 'As datas se sobrepõem com outra competição';
    }
    
    return null;
  };

  const handleSave = async () => {
    if (!competition) return;

    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha ambas as datas",
        variant: "destructive",
      });
      return;
    }

    const isActive = competition.status === 'active';
    const validationError = await validateDates(startDate, endDate, isActive);
    
    if (validationError) {
      toast({
        title: "Erro",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      let response: WeeklyConfigRpcResponse;
      if (isActive) {
        // Para competições ativas, só permite alterar a data de fim
        const { data, error } = await supabase.rpc('update_active_competition_end_date', {
          competition_id: competition.id,
          new_end_date: endDate
        });

        if (error) throw error;
        response = data as unknown as WeeklyConfigRpcResponse;
      } else {
        // Para competições agendadas, permite alterar ambas as datas
        const { data, error } = await supabase.rpc('update_scheduled_competition', {
          competition_id: competition.id,
          new_start_date: startDate,
          new_end_date: endDate
        });

        if (error) throw error;
        response = data as unknown as WeeklyConfigRpcResponse;
      }

      if (isWeeklyConfigRpcResponse(response) && response.success) {
        toast({
          title: "Sucesso!",
          description: response.message || 'Competição atualizada com sucesso',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(response?.error || 'Erro desconhecido');
      }

    } catch (error: any) {
      logger.error('Erro ao atualizar competição:', { error }, 'USE_EDIT_COMPETITION_MODAL');
      toast({
        title: "Erro",
        description: `Erro ao atualizar competição: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isLoading,
    handleSave
  };
};
