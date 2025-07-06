import { useState, useCallback } from 'react';
import { UnifiedCompetition } from '@/types/competition';
import { customCompetitionService } from '@/services/customCompetitionService';
import { logger } from '@/utils/logger';

export interface BulkDeleteProgress {
  total: number;
  completed: number;
  failed: number;
  current: string | null;
  errors: string[];
}

export const useBulkCompetitionActions = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<BulkDeleteProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    current: null,
    errors: []
  });

  const toggleSelection = useCallback((competitionId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(competitionId)) {
        newSet.delete(competitionId);
      } else {
        newSet.add(competitionId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((competitions: UnifiedCompetition[]) => {
    setSelectedIds(new Set(competitions.map(comp => comp.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const bulkDelete = useCallback(async (
    competitions: UnifiedCompetition[],
    onSuccess?: (deletedIds: string[]) => void
  ) => {
    if (selectedIds.size === 0) return;

    const selectedCompetitions = competitions.filter(comp => selectedIds.has(comp.id));
    
    setIsDeleting(true);
    setDeleteProgress({
      total: selectedCompetitions.length,
      completed: 0,
      failed: 0,
      current: null,
      errors: []
    });

    const deletedIds: string[] = [];
    const errors: string[] = [];

    try {
      for (const competition of selectedCompetitions) {
        setDeleteProgress(prev => ({
          ...prev,
          current: competition.title
        }));

        try {
          const result = await customCompetitionService.deleteCompetition(competition.id);
          
          if (result.success) {
            deletedIds.push(competition.id);
            setDeleteProgress(prev => ({
              ...prev,
              completed: prev.completed + 1
            }));
          } else {
            errors.push(`${competition.title}: ${result.error || 'Erro desconhecido'}`);
            setDeleteProgress(prev => ({
              ...prev,
              failed: prev.failed + 1,
              errors: [...prev.errors, `${competition.title}: ${result.error || 'Erro desconhecido'}`]
            }));
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push(`${competition.title}: ${errorMsg}`);
          setDeleteProgress(prev => ({
            ...prev,
            failed: prev.failed + 1,
            errors: [...prev.errors, `${competition.title}: ${errorMsg}`]
          }));
        }

        // Pequeno delay entre exclusões para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Limpar seleção após exclusão
      clearSelection();
      
      // Callback de sucesso
      if (onSuccess && deletedIds.length > 0) {
        onSuccess(deletedIds);
      }

      logger.info('Exclusão em massa concluída', {
        total: selectedCompetitions.length,
        deleted: deletedIds.length,
        failed: errors.length
      }, 'BULK_COMPETITION_DELETE');

    } catch (error) {
      logger.error('Erro na exclusão em massa:', { error }, 'BULK_COMPETITION_DELETE');
    } finally {
      setIsDeleting(false);
      setDeleteProgress(prev => ({ ...prev, current: null }));
    }

    return {
      deleted: deletedIds.length,
      failed: errors.length,
      errors
    };
  }, [selectedIds, clearSelection]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkDelete,
    isDeleting,
    deleteProgress
  };
};