
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useInviteVerification } from '@/hooks/useInviteVerification';
import { InvitesTabHeader } from './layout/InvitesTabHeader';
import { InviteMonthlyCompetition } from './invite/InviteMonthlyCompetition';
import { InviteMonitoring } from './invite/InviteMonitoring';
import { logger } from '@/utils/logger';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Trophy,
  Shield
} from 'lucide-react';

export const InviteDashboard = () => {
  const { isVerifying, triggerManualVerification, getInviteSystemStats } = useInviteVerification();
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const { toast } = useToast();

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const result = await getInviteSystemStats();
      if (result.success) {
        setStats(result.stats);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as estatísticas.",
          variant: "destructive"
        });
      }
    } catch (error) {
      logger.error('Erro ao carregar estatísticas:', { error }, 'INVITE_DASHBOARD');
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleManualVerification = async () => {
    const result = await triggerManualVerification();
    if (result.success) {
      // Recarregar estatísticas após verificação
      loadStats();
    }
  };

  const statsCards = [
    {
      title: "Total de Recompensas",
      value: stats?.totalRewards || 0,
      icon: UserPlus,
      description: "Recompensas criadas no sistema",
      color: "text-blue-600"
    },
    {
      title: "Recompensas Parciais",
      value: stats?.partialRewards || 0,
      icon: Clock,
      description: "Aguardando ativação (5 dias)",
      color: "text-orange-600"
    },
    {
      title: "Recompensas Processadas",
      value: stats?.processedRewards || 0,
      icon: CheckCircle,
      description: "Totalmente processadas",
      color: "text-green-600"
    },
    {
      title: "Recompensas Pendentes",
      value: stats?.pendingRewards || 0,
      icon: AlertCircle,
      description: "Aguardando processamento",
      color: "text-red-600"
    },
    {
      title: "Dias de Atividade",
      value: stats?.totalActivityDays || 0,
      icon: TrendingUp,
      description: "Total de registros de atividade",
      color: "text-purple-600"
    },
    {
      title: "Usuários Ativos",
      value: stats?.uniqueActiveUsers || 0,
      icon: Users,
      description: "Usuários com atividade registrada",
      color: "text-indigo-600"
    }
  ];

  return (
    <div className="space-y-6">
      <InvitesTabHeader />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="h-12 p-1 bg-white border border-slate-200 shadow-sm">
            <TabsTrigger 
              value="statistics" 
              className="h-10 px-4 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Estatísticas do Sistema
            </TabsTrigger>
            <TabsTrigger 
              value="monthly-competition" 
              className="h-10 px-4 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Competição Mensal
            </TabsTrigger>
            <TabsTrigger 
              value="monitoring" 
              className="h-10 px-4 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              <Shield className="h-4 w-4 mr-2" />
              Monitoramento
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="statistics" className="mt-0">
              <div className="space-y-6">
                {/* Controls */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Estatísticas do Sistema</h3>
                    <p className="text-slate-600 text-sm">Monitoramento em tempo real das indicações</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={loadStats} 
                      variant="outline"
                      disabled={isLoadingStats}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStats ? 'animate-spin' : ''}`} />
                      Atualizar Stats
                    </Button>
                    <Button 
                      onClick={handleManualVerification}
                      disabled={isVerifying}
                    >
                      <CheckCircle className={`w-4 h-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
                      {isVerifying ? 'Verificando...' : 'Verificar Convites'}
                    </Button>
                  </div>
                </div>

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statsCards.map((stat, index) => (
                    <Card key={index} className="border-slate-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                          {stat.title}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                          {isLoadingStats ? '...' : stat.value.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500">
                          {stat.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Sistema de Pontuação */}
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Sistema de Pontuação
                    </CardTitle>
                    <CardDescription>
                      Como funciona o sistema de recompensas por indicações
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">Recompensa Imediata</h4>
                        <p className="text-blue-700 text-sm">
                          <strong>5 XP</strong> são creditados imediatamente quando um usuário usa seu código de convite.
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">Recompensa Completa</h4>
                        <p className="text-green-700 text-sm">
                          <strong>+45 XP</strong> (total 50 XP) são creditados após o usuário convidado completar 5 dias de atividade.
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">Processo Automático</h4>
                      <p className="text-slate-600 text-sm">
                        O sistema verifica automaticamente a cada hora se os usuários convidados atingiram os 5 dias de atividade 
                        e processa as recompensas pendentes. Você também pode executar uma verificação manual usando o botão acima.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monthly-competition" className="mt-0">
              <InviteMonthlyCompetition />
            </TabsContent>

            <TabsContent value="monitoring" className="mt-0">
              <InviteMonitoring />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
