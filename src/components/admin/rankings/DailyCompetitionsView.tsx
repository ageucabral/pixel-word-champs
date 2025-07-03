
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from 'lucide-react';
import { UnifiedCompetitionsList } from './UnifiedCompetitionsList';
import { UnifiedCompetitionModal } from './UnifiedCompetitionModal';
import { UnifiedCompetition } from '@/types/competition';
import { useToast } from "@/hooks/use-toast";
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';

interface DailyCompetitionsViewProps {
  competitions: UnifiedCompetition[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export const DailyCompetitionsView = ({ competitions, isLoading, onRefresh }: DailyCompetitionsViewProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localCompetitions, setLocalCompetitions] = useState<UnifiedCompetition[]>([]);
  const { toast } = useToast();

  // Use local competitions if available, otherwise use props
  const displayedCompetitions = localCompetitions.length > 0 ? localCompetitions : competitions;

  // Update local competitions when props change
  React.useEffect(() => {
    setLocalCompetitions(competitions);
  }, [competitions]);

  const handleDelete = (competition: UnifiedCompetition) => {
    console.log('✅ Competição excluída:', competition.id);
    
    // Optimistic update: remove immediately from local state
    setLocalCompetitions(prev => prev.filter(comp => comp.id !== competition.id));
    
    toast({
      title: "Competição removida",
      description: "A competição foi excluída com sucesso.",
    });

    // Optionally refresh from server to ensure consistency
    if (onRefresh) {
      // Small delay to allow user to see the immediate update
      setTimeout(() => {
        onRefresh();
      }, 1000);
    }
  };

  const handleCompetitionCreated = () => {
    console.log('✅ Competição criada com sucesso', {
      timestamp: getCurrentBrasiliaTime()
    });
    
    setShowCreateModal(false);
    toast({
      title: "Competição criada",
      description: "A nova competição foi criada com sucesso.",
    });
    
    // Refresh data after creation
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleOpenModal = () => {
    console.log('🎯 Tentando abrir modal de nova competição', {
      timestamp: getCurrentBrasiliaTime(),
      currentModalState: showCreateModal
    });
    
    try {
      setShowCreateModal(true);
      console.log('✅ Modal definido como aberto', {
        timestamp: getCurrentBrasiliaTime()
      });
    } catch (error) {
      console.error('❌ Erro ao abrir modal:', error, {
        timestamp: getCurrentBrasiliaTime()
      });
      
      toast({
        title: "Erro",
        description: "Não foi possível abrir o modal de criação.",
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = (open: boolean) => {
    console.log('🔄 Alterando estado do modal', {
      open,
      timestamp: getCurrentBrasiliaTime()
    });
    setShowCreateModal(open);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Competições Diárias</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Gerencie competições diárias focadas no engajamento dos usuários
                </p>
              </div>
            </div>
            <Button onClick={handleOpenModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Competição
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Competições */}
      <UnifiedCompetitionsList
        competitions={displayedCompetitions}
        isLoading={isLoading}
        onDelete={handleDelete}
      />

      {/* Modal de Criação */}
      {showCreateModal && (
        <UnifiedCompetitionModal
          open={showCreateModal}
          onOpenChange={handleCloseModal}
          onCompetitionCreated={handleCompetitionCreated}
          competitionTypeFilter="daily"
        />
      )}
    </div>
  );
};
