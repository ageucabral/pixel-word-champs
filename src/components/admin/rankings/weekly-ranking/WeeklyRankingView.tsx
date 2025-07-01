
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trophy, Settings, Award } from 'lucide-react';
import { WeeklyRankingTable } from './WeeklyRankingTable';
import { WeeklyRankingStats } from './WeeklyRankingStats';
import { WeeklyConfigModalWrapper } from './WeeklyConfigModalWrapper';
import { WeeklyAutomationStatus } from './WeeklyAutomationStatus';
import { WeeklyCompetitionDiagnostic } from './WeeklyCompetitionDiagnostic';
import { PrizeConfigModal } from '../PrizeConfigModal';
import { useWeeklyRanking } from '@/hooks/useWeeklyRanking';
import { Loader2 } from 'lucide-react';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';

export const WeeklyRankingView = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [prizeConfigModalOpen, setPrizeConfigModalOpen] = useState(false);
  const { 
    currentRanking, 
    stats, 
    isLoading, 
    error, 
    refetch
  } = useWeeklyRanking();

  const handleConfigUpdated = () => {
    console.log('✅ Configuração semanal atualizada', {
      timestamp: getCurrentBrasiliaTime()
    });
    refetch();
  };

  const handleConfigModalOpen = () => {
    console.log('🎯 WeeklyRankingView - Abrindo modal de configuração semanal', {
      timestamp: getCurrentBrasiliaTime(),
      currentState: {
        configModalOpen,
        prizeConfigModalOpen
      }
    });
    
    try {
      setConfigModalOpen(true);
      console.log('✅ WeeklyRankingView - Modal state atualizado para true');
    } catch (error) {
      console.error('❌ WeeklyRankingView - Erro ao abrir modal:', error);
    }
  };

  const handleConfigModalClose = (open: boolean) => {
    console.log('🔄 WeeklyRankingView - Modal de configuração semanal:', { 
      open,
      timestamp: getCurrentBrasiliaTime()
    });
    setConfigModalOpen(open);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-gray-600">Carregando ranking semanal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  // Log de renderização fora do JSX
  console.log('🎯 WeeklyRankingView - Renderizando componente', {
    configModalOpen,
    timestamp: getCurrentBrasiliaTime()
  });

  return (
    <div className="space-y-6">
      {/* Header com botões essenciais apenas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Ranking Semanal
          </h2>
          <p className="text-sm text-slate-600">Classificação dos jogadores da semana - Atualização automática</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleConfigModalOpen}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar Competição
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setPrizeConfigModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Award className="h-4 w-4" />
            Configurar Premiação
          </Button>
        </div>
      </div>

      {/* Diagnóstico do Sistema */}
      <WeeklyCompetitionDiagnostic />

      {/* Status da Automação */}
      <WeeklyAutomationStatus />

      {/* Estatísticas Básicas */}
      <WeeklyRankingStats stats={stats} onConfigUpdated={refetch} />

      {/* Tabela de Ranking */}
      <WeeklyRankingTable ranking={currentRanking} />

      {/* Modal de Configuração com Wrapper */}
      <WeeklyConfigModalWrapper
        open={configModalOpen}
        onOpenChange={handleConfigModalClose}
        onConfigUpdated={handleConfigUpdated}
      />

      {/* Modal de Configuração de Premiação */}
      <PrizeConfigModal
        open={prizeConfigModal

Open}
        onOpenChange={setPrizeConfigModalOpen}
      />
    </div>
  );
};
