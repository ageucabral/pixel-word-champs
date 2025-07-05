
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { formatDateForDisplay } from '@/utils/dateFormatters';
import { Trash2, AlertTriangle } from 'lucide-react';
import { WeeklyConfig, WeeklyConfigRpcResponse, isWeeklyConfigRpcResponse } from '@/types/weeklyConfig';
import { logger } from '@/utils/logger';

interface DeleteCompetitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: WeeklyConfig | null;
  onSuccess: () => void;
}

export const DeleteCompetitionModal: React.FC<DeleteCompetitionModalProps> = ({
  open,
  onOpenChange,
  competition,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!competition) return;

    try {
      setIsDeleting(true);

      const { data, error } = await supabase.rpc('delete_scheduled_competition', {
        competition_id: competition.id
      });

      if (error) throw error;

      // Type casting com validação
      const response = data as unknown as WeeklyConfigRpcResponse;

      if (isWeeklyConfigRpcResponse(response) && response.success) {
        toast({
          title: "Competição Excluída!",
          description: response.message || 'Competição excluída com sucesso',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(response?.error || 'Erro desconhecido');
      }

    } catch (error: any) {
      logger.error('Erro ao excluir competição:', { error }, 'DELETE_COMPETITION_MODAL');
      toast({
        title: "Erro",
        description: `Erro ao excluir competição: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!competition) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir a competição agendada para o período de{' '}
              <strong>{formatDateForDisplay(competition.start_date)}</strong> até{' '}
              <strong>{formatDateForDisplay(competition.end_date)}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. A competição será removida permanentemente.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full mr-2" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Excluir</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
