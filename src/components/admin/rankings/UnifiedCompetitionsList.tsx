
import React from 'react';
import { UnifiedCompetition } from '@/types/competition';
import { DeleteCompetitionModal } from './DeleteCompetitionModal';
import { CompetitionCard } from './unified-list/CompetitionCard';
import { EmptyState } from './unified-list/EmptyState';
import { LoadingState } from './unified-list/LoadingState';
import { useCompetitionActions } from './unified-list/useCompetitionActions';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, Trash2 } from 'lucide-react';

interface UnifiedCompetitionsListProps {
  competitions: UnifiedCompetition[];
  isLoading: boolean;
  onDelete: (competition: UnifiedCompetition) => void;
  showBulkActions?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (competitionId: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onBulkDelete?: () => void;
  isBulkDeleting?: boolean;
}

export const UnifiedCompetitionsList: React.FC<UnifiedCompetitionsListProps> = ({
  competitions,
  isLoading,
  onDelete,
  showBulkActions = false,
  selectedIds = new Set(),
  onSelectionChange,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  isBulkDeleting = false
}) => {
  const {
    deleteModalOpen,
    setDeleteModalOpen,
    competitionToDelete,
    isDeletingId,
    handleDeleteClick,
    handleConfirmDelete
  } = useCompetitionActions(onDelete);

  if (isLoading) {
    return <LoadingState />;
  }

  if (competitions.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Controles de seleção em massa */}
      {showBulkActions && competitions.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectedIds.size === competitions.length ? onClearSelection : onSelectAll}
                className="gap-2"
              >
                {selectedIds.size === competitions.length ? (
                  <>
                    <Square className="h-4 w-4" />
                    Desmarcar Todas
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Selecionar Todas
                  </>
                )}
              </Button>
              
              {selectedIds.size > 0 && (
                <Badge variant="secondary">
                  {selectedIds.size} selecionadas
                </Badge>
              )}
            </div>
          </div>
          
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              disabled={isBulkDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isBulkDeleting ? 'Excluindo...' : `Excluir ${selectedIds.size}`}
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {competitions.map((competition) => (
          <CompetitionCard
            key={competition.id}
            competition={competition}
            onDelete={handleDeleteClick}
            isDeleting={isDeletingId === competition.id}
            showSelection={showBulkActions}
            isSelected={selectedIds.has(competition.id)}
            onSelectionChange={onSelectionChange}
          />
        ))}
      </div>

      <DeleteCompetitionModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        competition={competitionToDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeletingId === competitionToDelete?.id}
      />
    </>
  );
};
