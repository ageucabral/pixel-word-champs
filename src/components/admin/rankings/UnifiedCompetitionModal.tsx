
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnifiedCompetitionFormWrapper } from './UnifiedCompetitionFormWrapper';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface UnifiedCompetitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompetitionCreated?: () => void;
  competitionTypeFilter?: 'daily';
}

export const UnifiedCompetitionModal: React.FC<UnifiedCompetitionModalProps> = ({
  open,
  onOpenChange,
  onCompetitionCreated,
  competitionTypeFilter
}) => {
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = () => {
    logger.info('🔄 Tentando novamente carregar o formulário...', {
      timestamp: getCurrentBrasiliaTime(),
      retryCount: retryKey + 1
    }, 'UNIFIED_COMPETITION_MODAL');
    setRetryKey(prev => prev + 1);
  };

  const handleClose = () => {
    logger.info('🔄 Fechando modal de competição', {
      timestamp: getCurrentBrasiliaTime()
    }, 'UNIFIED_COMPETITION_MODAL');
    onOpenChange(false);
  };

  const handleSuccess = () => {
    logger.info('✅ Competição criada com sucesso - fechando modal', {
      timestamp: getCurrentBrasiliaTime()
    }, 'UNIFIED_COMPETITION_MODAL');
    
    if (onCompetitionCreated) {
      onCompetitionCreated();
    }
    
    // Fechar modal após sucesso
    onOpenChange(false);
  };

  const handleError = (error: any) => {
    logger.error('❌ Erro no formulário de competição:', { error, timestamp: getCurrentBrasiliaTime() }, 'UNIFIED_COMPETITION_MODAL');
  };

  React.useEffect(() => {
    if (open) {
      logger.info('🎯 Modal de competição aberto', {
        timestamp: getCurrentBrasiliaTime(),
        competitionTypeFilter
      }, 'UNIFIED_COMPETITION_MODAL');
    }
  }, [open, competitionTypeFilter]);

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Criar Competição Diária
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <UnifiedCompetitionFormWrapper
            key={retryKey}
            onClose={handleClose}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
