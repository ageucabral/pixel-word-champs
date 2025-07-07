import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Database,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';
import { useSystemHealth, useSystemIntegrity, useAdvancedAnalytics } from '@/hooks/useSystemMonitoring';
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from '@/utils/logger';
import { ValidationTabContent } from '@/components/admin/layout/ValidationTabContent';
import { WeeklyFinalizationMonitor } from '@/components/admin/WeeklyFinalizationMonitor';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'clean':
        return { color: 'bg-green-500', text: 'Saudável', icon: CheckCircle };
      case 'warning':
      case 'minor_issues':
        return { color: 'bg-yellow-500', text: 'Atenção', icon: AlertTriangle };
      case 'critical':
      case 'major_issues':
        return { color: 'bg-red-500', text: 'Crítico', icon: XCircle };
      default:
        return { color: 'bg-gray-500', text: 'Desconhecido', icon: Clock };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} text-white border-0`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.text}
    </Badge>
  );
};

const MetricCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description?: string;
  color?: string;
}> = ({ title, value, icon, description, color = "text-blue-600" }) => (
  <Card className="border-slate-200 shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`${color} p-2 rounded-lg bg-opacity-10`}>
            {icon}
          </div>
          <div>
            <div className="text-sm text-slate-600">{title}</div>
            <div className="text-xl font-bold text-slate-900">{value}</div>
            {description && <div className="text-xs text-slate-500">{description}</div>}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const SystemMonitoringTab = () => {
  const { 
    data: healthData, 
    loading: healthLoading, 
    error: healthError, 
    refresh: refreshHealth 
  } = useSystemHealth(true, 60000); // Auto-refresh a cada 60 segundos

  const { 
    data: integrityData, 
    loading: integrityLoading, 
    error: integrityError, 
    validate: validateIntegrity 
  } = useSystemIntegrity();

  const { 
    data: analyticsData, 
    loading: analyticsLoading, 
    error: analyticsError, 
    refresh: refreshAnalytics 
  } = useAdvancedAnalytics();

  useEffect(() => {
    logger.debug('Iniciando monitoramento do sistema', undefined, 'SYSTEM_MONITORING_TAB');
    // Carregar dados iniciais com delay para evitar sobrecarga
    const loadInitialData = async () => {
      await validateIntegrity();
      setTimeout(() => refreshAnalytics(), 1000);
    };
    loadInitialData();
  }, [validateIntegrity, refreshAnalytics]);

  const isLoading = healthLoading || integrityLoading || analyticsLoading;
  const hasError = healthError || integrityError || analyticsError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg shadow-md">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Monitoramento do Sistema
                </h1>
                <p className="text-slate-600 mt-1 text-sm">
                  Monitor em tempo real da saúde, integridade e performance da plataforma
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  refreshHealth();
                  validateIntegrity();
                  refreshAnalytics();
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        {healthData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Status Geral</div>
                    <StatusBadge status={healthData.overall_status} />
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Integridade</div>
                    {integrityData ? (
                      <StatusBadge status={integrityData.system_status} />
                    ) : (
                      <Skeleton className="h-6 w-16" />
                    )}
                  </div>
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Última Atualização</div>
                    <div className="text-xs text-slate-500">
                      {new Date(healthData.timestamp).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Messages */}
        {hasError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {healthError || integrityError || analyticsError}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Tabs defaultValue="health" className="w-full">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <TabsList className="grid grid-cols-5 bg-white border border-slate-200">
                <TabsTrigger 
                  value="health" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <Activity className="h-4 w-4" />
                  Saúde do Sistema
                </TabsTrigger>
                <TabsTrigger 
                  value="finalization" 
                  className="flex items-center gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
                >
                  <Clock className="h-4 w-4" />
                  Finalização Automática
                </TabsTrigger>
                <TabsTrigger 
                  value="integrity" 
                  className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
                >
                  <Shield className="h-4 w-4" />
                  Integridade
                </TabsTrigger>
                <TabsTrigger 
                  value="validation" 
                  className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
                >
                  <Shield className="h-4 w-4" />
                  Time Zone
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
                >
                  <TrendingUp className="h-4 w-4" />
                  Analytics Avançados
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="health" className="space-y-6 mt-0">
                {healthLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : healthData ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="Usuários Ativos (7d)"
                        value={healthData.metrics.active_users_7d}
                        icon={<Users className="h-5 w-5" />}
                        color="text-blue-600"
                      />
                      <MetricCard
                        title="Taxa de Conclusão"
                        value={`${healthData.metrics.completion_rate}%`}
                        icon={<CheckCircle className="h-5 w-5" />}
                        color="text-green-600"
                      />
                      <MetricCard
                        title="Conexões Ativas"
                        value={healthData.performance.active_connections}
                        icon={<Database className="h-5 w-5" />}
                        color="text-purple-600"
                      />
                      <MetricCard
                        title="Cache Hit Rate"
                        value={`${healthData.performance.cache_hit_ratio}%`}
                        icon={<TrendingUp className="h-5 w-5" />}
                        color="text-orange-600"
                      />
                    </div>

                    {healthData.recommendations.length > 0 && (
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader>
                          <CardTitle className="text-yellow-800 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Recomendações
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {healthData.recommendations.map((rec, index) => (
                              <li key={index} className="text-yellow-700 text-sm">
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : null}
              </TabsContent>

              <TabsContent value="finalization" className="space-y-6 mt-0">
                <WeeklyFinalizationMonitor />
              </TabsContent>

              <TabsContent value="integrity" className="space-y-6 mt-0">
                {integrityLoading ? (
                  <Skeleton className="h-48" />
                ) : integrityData ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="Sessões Órfãs"
                        value={integrityData.summary.orphaned_sessions}
                        icon={<Database className="h-5 w-5" />}
                        color={integrityData.summary.orphaned_sessions > 0 ? "text-red-600" : "text-green-600"}
                      />
                      <MetricCard
                        title="Rankings Inválidos"
                        value={integrityData.summary.invalid_rankings}
                        icon={<Shield className="h-5 w-5" />}
                        color={integrityData.summary.invalid_rankings > 0 ? "text-red-600" : "text-green-600"}
                      />
                      <MetricCard
                        title="Perfis Órfãos"
                        value={integrityData.summary.missing_profiles}
                        icon={<Users className="h-5 w-5" />}
                        color={integrityData.summary.missing_profiles > 0 ? "text-red-600" : "text-green-600"}
                      />
                      <MetricCard
                        title="Convites Duplicados"
                        value={integrityData.summary.duplicate_invites}
                        icon={<AlertTriangle className="h-5 w-5" />}
                        color={integrityData.summary.duplicate_invites > 0 ? "text-red-600" : "text-green-600"}
                      />
                    </div>

                    {integrityData.issues_found.length > 0 && (
                      <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                          <CardTitle className="text-red-800 flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Problemas Encontrados
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {integrityData.issues_found.map((issue, index) => (
                              <div key={index} className="bg-white p-3 rounded border border-red-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium text-red-800">{issue.type}</div>
                                    <div className="text-sm text-red-600">
                                      {issue.count} ocorrência(s)
                                    </div>
                                  </div>
                                  <Badge variant="destructive">{issue.count}</Badge>
                                </div>
                                <div className="text-sm text-red-700 mt-2">
                                  <strong>Solução:</strong> {issue.solution}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : null}
              </TabsContent>

              <TabsContent value="validation" className="space-y-6 mt-0">
                <ValidationTabContent />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-0">
                {analyticsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                ) : analyticsData ? (
                  <>
                    {/* User Engagement */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Engajamento de Usuários</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                          title="Total de Usuários"
                          value={analyticsData.user_engagement.total_users}
                          icon={<Users className="h-5 w-5" />}
                          color="text-blue-600"
                        />
                        <MetricCard
                          title="Taxa de Engajamento"
                          value={`${analyticsData.user_engagement.engagement_rate}%`}
                          icon={<TrendingUp className="h-5 w-5" />}
                          color="text-green-600"
                        />
                        <MetricCard
                          title="Usuários Ativos Semanais"
                          value={analyticsData.user_engagement.weekly_active_users}
                          icon={<Activity className="h-5 w-5" />}
                          color="text-purple-600"
                        />
                        <MetricCard
                          title="Taxa de Retenção"
                          value={`${analyticsData.user_engagement.retention_rate}%`}
                          icon={<CheckCircle className="h-5 w-5" />}
                          color="text-orange-600"
                        />
                      </div>
                    </div>

                    {/* Growth Metrics */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Métricas de Crescimento</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <MetricCard
                          title="Novos Usuários (Semana)"
                          value={analyticsData.growth_metrics.new_users_this_week}
                          icon={<Users className="h-5 w-5" />}
                          color="text-blue-600"
                        />
                        <MetricCard
                          title="Novos Usuários (Mês)"
                          value={analyticsData.growth_metrics.new_users_this_month}
                          icon={<Users className="h-5 w-5" />}
                          color="text-green-600"
                        />
                        <MetricCard
                          title="Taxa de Ativação"
                          value={`${analyticsData.growth_metrics.activation_rate}%`}
                          icon={<TrendingUp className="h-5 w-5" />}
                          color="text-purple-600"
                        />
                      </div>
                    </div>
                  </>
                ) : null}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};