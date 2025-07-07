import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Play, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface WeeklyCompetition {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface MonitoringData {
  status: string;
  expired_competitions: number;
  active_competitions: number;
  cron_configured: boolean;
  timestamp: string;
}

export const WeeklyFinalizationMonitor = () => {
  const [competitions, setCompetitions] = useState<WeeklyCompetition[]>([]);
  const [monitoring, setMonitoring] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar competições semanais
      const { data: competitionsData, error: competitionsError } = await supabase
        .from('weekly_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (competitionsError) throw competitionsError;
      
      // Executar monitoramento
      const { data: monitoringData, error: monitoringError } = await supabase
        .rpc('monitor_cron_executions');

      if (monitoringError) throw monitoringError;

      setCompetitions(competitionsData || []);
      setMonitoring(monitoringData as unknown as MonitoringData);

      logger.info('Dados de monitoramento carregados', { 
        competitions: competitionsData?.length || 0,
        monitoring: monitoringData 
      }, 'WEEKLY_FINALIZATION_MONITOR');

    } catch (error) {
      logger.error('Erro ao carregar dados de monitoramento', { error }, 'WEEKLY_FINALIZATION_MONITOR');
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de monitoramento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testFinalizer = async () => {
    try {
      setTesting(true);
      
      const { data, error } = await supabase
        .rpc('test_weekly_finalizer');

      if (error) throw error;

      toast({
        title: "Teste executado com sucesso",
        description: "A edge function foi chamada manualmente",
        variant: "default"
      });

      logger.info('Teste manual da edge function executado', { result: data }, 'WEEKLY_FINALIZATION_MONITOR');
      
      // Recarregar dados após teste
      await loadData();

    } catch (error) {
      logger.error('Erro ao testar finalizer', { error }, 'WEEKLY_FINALIZATION_MONITOR');
      toast({
        title: "Erro no teste",
        description: "Não foi possível executar o teste da edge function",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const runManualFinalization = async () => {
    try {
      setFinalizing(true);
      
      const { data, error } = await supabase
        .rpc('finalize_weekly_competition');

      if (error) throw error;

      if ((data as any)?.success) {
        toast({
          title: "Finalização executada com sucesso",
          description: `${(data as any).profiles_reset || 0} perfis foram resetados`,
          variant: "default"
        });
      } else {
        toast({
          title: "Nenhuma ação necessária",
          description: "Não há competições que precisem ser finalizadas",
          variant: "default"
        });
      }

      logger.info('Finalização manual executada', { result: data }, 'WEEKLY_FINALIZATION_MONITOR');
      
      // Recarregar dados após finalização
      await loadData();

    } catch (error) {
      logger.error('Erro na finalização manual', { error }, 'WEEKLY_FINALIZATION_MONITOR');
      toast({
        title: "Erro na finalização",
        description: "Não foi possível executar a finalização manual",
        variant: "destructive"
      });
    } finally {
      setFinalizing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-700">Ativa</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Finalizada</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Agendada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHealthStatus = () => {
    if (!monitoring) return null;
    
    switch (monitoring.status) {
      case 'healthy':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Sistema Saudável</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Atenção Necessária</span>
          </div>
        );
      case 'critical':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Situação Crítica</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Monitoramento de Finalização Automática</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Carregando dados de monitoramento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status do Sistema */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Status do Sistema de Finalização</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Próxima execução automática: 00:01 (horário de Brasília)
            </p>
          </div>
          <Button
            onClick={loadData}
            size="sm"
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Geral */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              {getHealthStatus()}
              <p className="text-sm text-slate-600 mt-1">
                Última verificação: {monitoring?.timestamp ? new Date(monitoring.timestamp).toLocaleString('pt-BR') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {monitoring?.active_competitions || 0}
              </div>
              <div className="text-sm text-blue-700">Competições Ativas</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {monitoring?.expired_competitions || 0}
              </div>
              <div className="text-sm text-red-700">Competições Expiradas</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {monitoring?.cron_configured ? '✓' : '✗'}
              </div>
              <div className="text-sm text-green-700">Cron Job Configurado</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                03:01
              </div>
              <div className="text-sm text-purple-700">Horário UTC de Execução</div>
            </div>
          </div>

          {/* Ações Manuais */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              onClick={testFinalizer}
              disabled={testing}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              {testing ? 'Testando...' : 'Testar Edge Function'}
            </Button>
            <Button
              onClick={runManualFinalization}
              disabled={finalizing}
              variant="default"
            >
              <Clock className="h-4 w-4 mr-2" />
              {finalizing ? 'Finalizando...' : 'Executar Finalização Manual'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Competições */}
      <Card>
        <CardHeader>
          <CardTitle>Competições Semanais Recentes</CardTitle>
          <p className="text-sm text-slate-600">
            Últimas 10 competições criadas no sistema
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {competitions.map((competition) => (
              <div
                key={competition.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(competition.status)}
                    <span className="font-medium">
                      {new Date(competition.start_date).toLocaleDateString('pt-BR')} - {' '}
                      {new Date(competition.end_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Criada em: {new Date(competition.created_at).toLocaleString('pt-BR')}
                    {competition.completed_at && (
                      <span className="ml-4">
                        Finalizada em: {new Date(competition.completed_at).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {competition.id.slice(0, 8)}...
                </div>
              </div>
            ))}
            {competitions.length === 0 && (
              <p className="text-center text-slate-500 py-8">
                Nenhuma competição encontrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};