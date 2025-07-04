import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMonthlyInviteCompetitionSimplified } from '@/hooks/useMonthlyInviteCompetitionSimplified';
import { MonthlyInviteStatsCards } from './monthly-invite/MonthlyInviteStatsCards';
import { MonthlyInviteRankingTable } from './monthly-invite/MonthlyInviteRankingTable';
import { MonthlyPrizeConfigModal } from './monthly-invite/MonthlyPrizeConfigModal';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Trophy, RefreshCw } from "lucide-react";

export const MonthlyInviteTab = () => {
  const { data, isLoading, error, refreshRanking, refetch } = useMonthlyInviteCompetitionSimplified();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPrizeConfig, setShowPrizeConfig] = useState(false);
  const { toast } = useToast();

  const handleRefreshRanking = async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshRanking();
      if (result?.success) {
        toast({
          title: "Ranking Atualizado",
          description: "O ranking mensal foi atualizado com sucesso.",
        });
      } else {
        throw new Error(result?.error || 'Erro desconhecido');
      }
    } catch (error) {
      toast({
        title: "Erro ao Atualizar",
        description: "Não foi possível atualizar o ranking.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePrizeConfigClick = () => {
    // Verificar se há dados da competição antes de abrir o modal
    if (!data?.competition?.id) {
      toast({
        title: "Competição não encontrada",
        description: "Aguarde o carregamento da competição ou tente atualizar a página.",
        variant: "destructive",
      });
      return;
    }
    
    setShowPrizeConfig(true);
  };

  const exportWinners = () => {
    if (!data?.rankings || data.rankings.length === 0) {
      toast({
        title: "Nenhum Dado",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const winners = data.rankings.filter((r: any) => r.prize_amount > 0);
    const csvContent = [
      ['Posição', 'Usuário', 'Pontos', 'Convites', 'Prêmio', 'Status', 'Chave PIX', 'Nome PIX'],
      ...winners.map((winner: any) => [
        winner.position,
        winner.username,
        winner.invite_points,
        winner.invites_count,
        `R$ ${winner.prize_amount}`,
        winner.payment_status,
        winner.pix_key || '',
        winner.pix_holder_name || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking-mensal-indicacoes-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exportação Concluída",
      description: "Lista de ganhadores exportada com sucesso.",
    });
  };

  // Loading skeleton seguindo padrão do WeeklyRankingView
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-80 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        {/* Table skeleton */}
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Error state seguindo padrão do WeeklyRankingView
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-lg border border-slate-200">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Erro ao Carregar Dados</h3>
        <p className="text-slate-600 mb-6 max-w-md">{error}</p>
        <Button onClick={refetch} size="lg">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Verificar se existe uma competição configurada
  if (!data?.competition) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-lg border border-slate-200">
        <Trophy className="h-16 w-16 text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhuma Competição Configurada</h3>
        <p className="text-slate-600 mb-6 max-w-md">
          Não foi possível encontrar ou criar a competição mensal
        </p>
        <Button onClick={refetch} size="lg">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const { competition, rankings, stats } = data;
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header padronizado seguindo exatamente o padrão do Ranking Semanal */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900">Competição Mensal de Indicações</h2>
          </div>
          <p className="text-slate-600">Classificação dos participantes do mês - {currentMonth}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePrizeConfigClick}
            variant="outline"
            className="bg-white hover:bg-slate-50"
            disabled={!competition?.id}
          >
            Configurar Premiação
          </Button>
          <Button
            onClick={handleRefreshRanking}
            disabled={isRefreshing}
            variant="outline"
            className="bg-white hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={exportWinners} 
            variant="outline"
            className="bg-white hover:bg-slate-50"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Exportar Ganhadores
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <MonthlyInviteStatsCards
        stats={stats}
        rankings={rankings}
        competition={competition}
      />

      {/* Tabela de ranking */}
      <MonthlyInviteRankingTable rankings={rankings} />

      {/* Modal de configuração de prêmios - só renderizar se tiver competição válida */}
      {competition?.id && (
        <MonthlyPrizeConfigModal
          open={showPrizeConfig}
          onOpenChange={setShowPrizeConfig}
          competitionId={competition.id}
        />
      )}
    </div>
  );
};
