
import React from 'react';
import { WeeklyConfigModal } from './WeeklyConfigModal';
import { WeeklyConfigErrorBoundary } from './WeeklyConfigErrorBoundary';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface WeeklyConfigModalWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigUpdated: () => void;
}

export const WeeklyConfigModalWrapper: React.FC<WeeklyConfigModalWrapperProps> = ({
  open,
  onOpenChange,
  onConfigUpdated
}) => {
  const handleRetry = () => {
    logger.info('🔄 WeeklyConfigModalWrapper - tentando recarregar modal...', {
      timestamp: getCurrentBrasiliaTime()
    }, 'WEEKLY_CONFIG_MODAL_WRAPPER');
    
    // Fechar e reabrir o modal para forçar re-render
    onOpenChange(false);
    setTimeout(() => {
      onOpenChange(true);
    }, 100);
  };

  const handleModalError = (error: any) => {
    logger.error('❌ Erro no WeeklyConfigModal:', { error, timestamp: getCurrentBrasiliaTime() }, 'WEEKLY_CONFIG_MODAL_WRAPPER');
  };

  React.useEffect(() => {
    if (open) {
      logger.info('🎯 WeeklyConfigModalWrapper - Modal aberto', {
        timestamp: getCurrentBrasiliaTime()
      }, 'WEEKLY_CONFIG_MODAL_WRAPPER');
    } else {
      logger.info('📴 WeeklyConfigModalWrapper - Modal fechado', {
        timestamp: getCurrentBrasiliaTime()
      }, 'WEEKLY_CONFIG_MODAL_WRAPPER');
    }
  }, [open]);

  logger.info('🔍 WeeklyConfigModalWrapper - Renderizando', {
    open,
    timestamp: getCurrentBrasiliaTime()
  }, 'WEEKLY_CONFIG_MODAL_WRAPPER');

  return (
    <WeeklyConfigErrorBoundary onRetry={handleRetry}>
      <WeeklyConfigModal
        open={open}
        onOpenChange={onOpenChange}
        onConfigUpdated={onConfigUpdated}
      />
    </WeeklyConfigErrorBoundary>
  );
};
