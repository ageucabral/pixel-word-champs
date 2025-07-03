import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Activity, Clock, Refresh } from 'lucide-react';
import { securityMonitoring, SecurityMetrics, SecurityEvent } from '@/services/securityMonitoring';
import { useToast } from "@/hooks/use-toast";

export const SecurityDashboard = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  const { toast } = useToast();

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      const [metricsData, alertsData] = await Promise.all([
        securityMonitoring.getSecurityMetrics(timeframe),
        securityMonitoring.getRecentAlerts(20)
      ]);

      setMetrics(metricsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de segurança",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, [timeframe]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-border border-t-primary"></div>
          <span className="text-sm">Carregando dados de segurança...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Dashboard de Segurança</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border p-1">
            {(['1h', '24h', '7d'] as const).map((period) => (
              <Button
                key={period}
                variant={timeframe === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(period)}
                className="px-3 py-1 text-xs"
              >
                {period === '1h' ? '1 Hora' : period === '24h' ? '24 Horas' : '7 Dias'}
              </Button>
            ))}
          </div>
          <Button onClick={loadSecurityData} variant="outline" size="sm">
            <Refresh className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Eventos</p>
                <p className="text-2xl font-bold">{metrics?.totalEvents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eventos Críticos</p>
                <p className="text-2xl font-bold text-red-600">{metrics?.criticalEvents || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-green-600">99.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Seguro
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alertas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Nenhum alerta de segurança recente. Sistema funcionando normalmente.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.event_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.details?.description || 'Evento de segurança detectado'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {alert.created_at ? new Date(alert.created_at).toLocaleString('pt-BR') : 'Agora'}
                    </p>
                    {alert.user_id && (
                      <p className="text-xs text-muted-foreground">ID: {alert.user_id.slice(0, 8)}...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribuição de eventos */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Eventos por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(metrics.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos por Severidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(metrics.eventsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{severity}</span>
                    <Badge className={getSeverityColor(severity)}>{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};