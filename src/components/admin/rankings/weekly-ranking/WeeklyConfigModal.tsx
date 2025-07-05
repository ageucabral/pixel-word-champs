
import React, { useState } from 'react';
import { useWeeklyConfigModal } from '@/hooks/useWeeklyConfigModal';
import { WeeklyConfigModalContainer } from './modal/WeeklyConfigModalContainer';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface WeeklyConfig {
  id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'scheduled' | 'ended' | 'completed';
  activated_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface WeeklyConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigUpdated: () => void;
}

export const WeeklyConfigModal: React.FC<WeeklyConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigUpdated
}) => {
  // Log simplificado apenas com informações básicas
  logger.info('🔍 WeeklyConfigModal - Renderizando modal semanal', {
    open,
    timestamp: getCurrentBrasiliaTime()
  }, 'WEEKLY_CONFIG_MODAL');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteCompletedModalOpen, setDeleteCompletedModalOpen] = useState(false);

  let modalLogic;
  try {
    logger.info('🔄 WeeklyConfigModal - Inicializando hook modal semanal...', undefined, 'WEEKLY_CONFIG_MODAL');
    modalLogic = useWeeklyConfigModal(onConfigUpdated);
    logger.info('✅ WeeklyConfigModal - Hook modal semanal inicializado', undefined, 'WEEKLY_CONFIG_MODAL');
  } catch (error) {
    logger.error('❌ WeeklyConfigModal - Erro ao inicializar hook:', { error: error?.message || 'Erro desconhecido' }, 'WEEKLY_CONFIG_MODAL');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Erro ao carregar configurações do modal</p>
        <p className="text-red-600 text-sm mt-1">{error?.message || 'Erro desconhecido'}</p>
      </div>
    );
  }

  const handleEdit = (competition: WeeklyConfig) => {
    modalLogic.setSelectedCompetition(competition);
    setEditModalOpen(true);
  };

  const handleDelete = (competition: WeeklyConfig) => {
    modalLogic.setSelectedCompetition(competition);
    setDeleteModalOpen(true);
  };

  const handleDeleteCompleted = (competition: any) => {
    modalLogic.setSelectedCompetition(competition);
    setDeleteCompletedModalOpen(true);
  };

  const handleModalSuccess = () => {
    modalLogic.loadConfigurations();
    modalLogic.refetchHistory();
    onConfigUpdated();
  };

  try {
    // Log básico sem objetos complexos
    logger.info('🔄 WeeklyConfigModal - Preparando dados do modal (dados básicos):', {
      hasActiveConfig: !!modalLogic.activeConfig,
      scheduledConfigsCount: modalLogic.scheduledConfigs?.length || 0,
      configsLoading: modalLogic.configsLoading,
      historyLoading: modalLogic.historyLoading
    }, 'WEEKLY_CONFIG_MODAL');
    
    const modalData = {
      activeConfig: modalLogic.activeConfig,
      scheduledConfigs: modalLogic.scheduledConfigs,
      lastCompletedConfig: modalLogic.lastCompletedConfig,
      configsLoading: modalLogic.configsLoading,
      isActivating: modalLogic.isActivating,
      isLoading: modalLogic.isLoading,
      newStartDate: modalLogic.newStartDate,
      newEndDate: modalLogic.newEndDate,
      historyPage: modalLogic.historyPage,
      weeklyHistoryData: modalLogic.weeklyHistoryData?.data || [],
      historyLoading: modalLogic.historyLoading,
      historyTotalPages: modalLogic.historyTotalPages,
      selectedCompetition: modalLogic.selectedCompetition
    };

    const modalStates = {
      editModalOpen,
      deleteModalOpen,
      deleteCompletedModalOpen
    };

    const onModalStatesChange = {
      setEditModalOpen,
      setDeleteModalOpen,
      setDeleteCompletedModalOpen
    };

    const handlers = {
      onEdit: handleEdit,
      onDelete: handleDelete,
      onDeleteCompleted: handleDeleteCompleted,
      onActivate: modalLogic.handleActivateCompetitions,
      onStartDateChange: modalLogic.setNewStartDate,
      onEndDateChange: modalLogic.setNewEndDate,
      onSchedule: modalLogic.handleScheduleNew,
      onFinalize: modalLogic.handleFinalize,
      onPageChange: modalLogic.setHistoryPage,
      onModalSuccess: handleModalSuccess
    };

    logger.info('✅ WeeklyConfigModal - Dados preparados, renderizando container', undefined, 'WEEKLY_CONFIG_MODAL');

    return (
      <WeeklyConfigModalContainer
        open={open}
        onOpenChange={onOpenChange}
        modalData={modalData}
        modalStates={modalStates}
        onModalStatesChange={onModalStatesChange}
        handlers={handlers}
      />
    );
  } catch (error) {
    logger.error('❌ WeeklyConfigModal - Erro ao preparar dados:', { error: error?.message || 'Erro desconhecido' }, 'WEEKLY_CONFIG_MODAL');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Erro ao preparar dados do modal</p>
        <p className="text-red-600 text-sm mt-1">{error?.message || 'Erro desconhecido'}</p>
      </div>
    );
  }
};
