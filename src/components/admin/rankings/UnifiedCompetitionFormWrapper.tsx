
import React from 'react';
import { UnifiedCompetitionForm } from './UnifiedCompetitionForm';
import { CompetitionFormErrorBoundary } from './CompetitionFormErrorBoundary';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface UnifiedCompetitionFormWrapperProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const UnifiedCompetitionFormWrapper: React.FC<UnifiedCompetitionFormWrapperProps> = ({
  onClose,
  onSuccess,
  onError
}) => {
  const handleRetry = () => {
    logger.info('🔄 Tentando recarregar formulário...', {
      timestamp: getCurrentBrasiliaTime()
    }, 'UNIFIED_COMPETITION_FORM_WRAPPER');
    window.location.reload();
  };

  const handleFormError = (error: any) => {
    logger.error('❌ Erro no formulário:', { error, timestamp: getCurrentBrasiliaTime() }, 'UNIFIED_COMPETITION_FORM_WRAPPER');
    onError(error instanceof Error ? error.message : 'Erro no formulário');
  };

  return (
    <CompetitionFormErrorBoundary onRetry={handleRetry}>
      <UnifiedCompetitionForm
        onClose={onClose}
        onSuccess={onSuccess}
        onError={handleFormError}
      />
    </CompetitionFormErrorBoundary>
  );
};
