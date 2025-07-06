import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { UnifiedCompetition } from '@/types/competition';
import { BulkDeleteProgress } from '@/hooks/useBulkCompetitionActions';

interface BulkDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitions: UnifiedCompetition[];
  selectedIds: Set<string>;
  onConfirm: () => void;
  isDeleting: boolean;
  progress: BulkDeleteProgress;
}

export const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({
  open,
  onOpenChange,
  competitions,
  selectedIds,
  onConfirm,
  isDeleting,
  progress
}) => {
  const selectedCompetitions = competitions.filter(comp => selectedIds.has(comp.id));

  if (isDeleting) {
    const progressPercentage = progress.total > 0 
      ? ((progress.completed + progress.failed) / progress.total) * 100 
      : 0;

    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Excluindo Competições...
            </DialogTitle>
            <DialogDescription>
              Por favor, aguarde enquanto as competições são excluídas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso</span>
                <span>{progress.completed + progress.failed} de {progress.total}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {progress.current && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Excluindo: <strong>{progress.current}</strong>
                </p>
              </div>
            )}

            {progress.completed > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>{progress.completed} competições excluídas com sucesso</span>
              </div>
            )}

            {progress.failed > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{progress.failed} falhas encontradas</span>
              </div>
            )}

            {progress.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <div className="max-h-20 overflow-y-auto">
                    {progress.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Confirmar Exclusão em Massa
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir <strong>{selectedIds.size}</strong> competições selecionadas?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Esta ação não pode ser desfeita. As seguintes competições serão permanentemente excluídas:
            </AlertDescription>
          </Alert>

          <div className="max-h-32 overflow-y-auto border rounded-lg p-2 bg-gray-50">
            {selectedCompetitions.map((comp) => (
              <div key={comp.id} className="text-sm py-1 px-2 hover:bg-white rounded">
                <span className="font-medium">{comp.title}</span>
                <span className="text-gray-500 ml-2">
                  ({comp.status})
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir {selectedIds.size} Competições
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};