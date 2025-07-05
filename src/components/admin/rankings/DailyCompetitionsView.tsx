
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from 'lucide-react';
import { UnifiedCompetitionsList } from './UnifiedCompetitionsList';
import { UnifiedCompetitionModal } from './UnifiedCompetitionModal';
import { DailyCompetitionFilters } from './daily/DailyCompetitionFilters';
import { UnifiedCompetition } from '@/types/competition';
import { useToast } from "@/hooks/use-toast";
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { parseISO, isSameDay } from 'date-fns';
import { logger } from '@/utils/logger';

interface DailyCompetitionsViewProps {
  competitions: UnifiedCompetition[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export const DailyCompetitionsView = ({ competitions, isLoading, onRefresh }: DailyCompetitionsViewProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localCompetitions, setLocalCompetitions] = useState<UnifiedCompetition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const { toast } = useToast();

  // Use local competitions if available, otherwise use props
  const allCompetitions = localCompetitions.length > 0 ? localCompetitions : competitions;

  // Aplicar filtros às competições
  const filteredCompetitions = useMemo(() => {
    return allCompetitions.filter((competition) => {
      // Filtro por título
      const matchesSearch = !searchTerm || 
        competition.title.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por status
      const matchesStatus = statusFilter === 'all' || competition.status === statusFilter;

      // Filtro por data
      const matchesDate = !dateFilter || (() => {
        try {
          const startDate = parseISO(competition.startDate);
          const endDate = parseISO(competition.endDate);
          return isSameDay(dateFilter, startDate) || 
                 isSameDay(dateFilter, endDate) ||
                 (dateFilter >= startDate && dateFilter <= endDate);
        } catch {
          return false;
        }
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [allCompetitions, searchTerm, statusFilter, dateFilter]);

  // Update local competitions when props change
  React.useEffect(() => {
    setLocalCompetitions(competitions);
  }, [competitions]);

  const handleDelete = (competition: UnifiedCompetition) => {
    logger.info('✅ Competição excluída:', { competitionId: competition.id }, 'DAILY_COMPETITIONS');
    
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
    logger.info('✅ Competição criada com sucesso', {
      timestamp: getCurrentBrasiliaTime()
    }, 'DAILY_COMPETITIONS');
    
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
    logger.info('🎯 Tentando abrir modal de nova competição', {
      timestamp: getCurrentBrasiliaTime(),
      currentModalState: showCreateModal
    }, 'DAILY_COMPETITIONS');
    
    try {
      setShowCreateModal(true);
      logger.info('✅ Modal definido como aberto', {
        timestamp: getCurrentBrasiliaTime()
      }, 'DAILY_COMPETITIONS');
    } catch (error) {
      logger.error('❌ Erro ao abrir modal:', { error, timestamp: getCurrentBrasiliaTime() }, 'DAILY_COMPETITIONS');
      
      toast({
        title: "Erro",
        description: "Não foi possível abrir o modal de criação.",
        variant: "destructive",
      });
    }
  };

  const handleCloseModal = (open: boolean) => {
    logger.info('🔄 Alterando estado do modal', {
      open,
      timestamp: getCurrentBrasiliaTime()
    }, 'DAILY_COMPETITIONS');
    setShowCreateModal(open);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter(null);
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

      {/* Filtros */}
      <DailyCompetitionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        onClearFilters={handleClearFilters}
        totalCompetitions={allCompetitions.length}
        filteredCount={filteredCompetitions.length}
      />

      {/* Lista de Competições */}
      <UnifiedCompetitionsList
        competitions={filteredCompetitions}
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
