
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { customCompetitionService } from '@/services/customCompetitionService';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';

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
    console.log('🗑️ Tentando excluir competição diária:', competition.id, {
      timestamp: getCurrentBrasiliaTime()
    });
    
    const confirmDelete = window.confirm(`Tem certeza que deseja excluir a competição "${competition.title}"?`);
    if (!confirmDelete) {
      console.log('❌ Exclusão cancelada pelo usuário', {
        timestamp: getCurrentBrasiliaTime()
      });
      return;
    }

    setDeletingId(competition.id);
    
    try {
      console.log('📤 Chamando serviço de exclusão...', {
        timestamp: getCurrentBrasiliaTime()
      });
      const response = await customCompetitionService.deleteCompetition(competition.id);
      
      if (response.success) {
        console.log('✅ Competição excluída com sucesso', {
          timestamp: getCurrentBrasiliaTime()
        });
        toast({
          title: "Competição excluída",
          description: `A competição "${competition.title}" foi excluída com sucesso.`,
        });
        
        if (onRefresh) {
          console.log('🔄 Atualizando lista de competições...', {
            timestamp: getCurrentBrasiliaTime()
          });
          onRefresh();
        }
      } else {
        console.error('❌ Erro no serviço:', response.error, {
          timestamp: getCurrentBrasiliaTime()
        });
        throw new Error(response.error || 'Erro ao excluir competição');
      }
    } catch (error) {
      console.error('❌ Erro ao excluir competição:', error, {
        timestamp: getCurrentBrasiliaTime()
      });
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
