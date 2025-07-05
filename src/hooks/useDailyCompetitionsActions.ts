
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { customCompetitionService } from '@/services/customCompetitionService';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface DailyCompetition {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  prize_pool: number;
  max_participants: number;
  total_participants: number;
  theme: string;
  rules: any;
}

export const useDailyCompetitionsActions = () => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (competition: DailyCompetition, onRefresh?: () => void) => {
    logger.info('🗑️ Tentando excluir competição diária:', { 
      competitionId: competition.id,
      timestamp: getCurrentBrasiliaTime()
    }, 'USE_DAILY_COMPETITIONS_ACTIONS');
    
    const confirmDelete = window.confirm(`Tem certeza que deseja excluir a competição "${competition.title}"?`);
    if (!confirmDelete) {
      logger.info('❌ Exclusão cancelada pelo usuário', { 
        timestamp: getCurrentBrasiliaTime()
      }, 'USE_DAILY_COMPETITIONS_ACTIONS');
      return;
    }

    setDeletingId(competition.id);
    
    try {
      logger.info('📤 Chamando serviço de exclusão...', { 
        timestamp: getCurrentBrasiliaTime()
      }, 'USE_DAILY_COMPETITIONS_ACTIONS');
      const response = await customCompetitionService.deleteCompetition(competition.id);
      
      if (response.success) {
        logger.info('✅ Competição excluída com sucesso', { 
          timestamp: getCurrentBrasiliaTime()
        }, 'USE_DAILY_COMPETITIONS_ACTIONS');
        toast({
          title: "Competição excluída",
          description: `A competição "${competition.title}" foi excluída com sucesso.`,
        });
        
        if (onRefresh) {
          logger.info('🔄 Atualizando lista de competições...', { 
            timestamp: getCurrentBrasiliaTime()
          }, 'USE_DAILY_COMPETITIONS_ACTIONS');
          onRefresh();
        }
      } else {
        logger.error('❌ Erro no serviço:', { 
          error: response.error,
          timestamp: getCurrentBrasiliaTime()
        }, 'USE_DAILY_COMPETITIONS_ACTIONS');
        throw new Error(response.error || 'Erro ao excluir competição');
      }
    } catch (error) {
      logger.error('❌ Erro ao excluir competição:', { 
        error,
        timestamp: getCurrentBrasiliaTime()
      }, 'USE_DAILY_COMPETITIONS_ACTIONS');
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Não foi possível excluir a competição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return {
    deletingId,
    handleDelete
  };
};
