
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Integration {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

interface IntegrationStatusOverviewProps {
  fingerprintJS: Integration;
}

export const IntegrationStatusOverview = ({ fingerprintJS }: IntegrationStatusOverviewProps) => {
  const activeIntegrations = [fingerprintJS].filter(integration => integration.status === 'active');

  logger.debug('Renderizando overview de status de integrações', { 
    totalIntegrations: 1,
    activeIntegrationsCount: activeIntegrations.length,
    fingerprintJSStatus: fingerprintJS?.status
  }, 'INTEGRATION_STATUS_OVERVIEW');

  const getStatusIcon = (status: string) => {
    return status === 'active' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-gray-400" />
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary">
        Inativo
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Integrações</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1</div>
          <p className="text-xs text-muted-foreground">
            Integração disponível na plataforma
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Integrações Ativas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeIntegrations.length}</div>
          <p className="text-xs text-muted-foreground">
            Funcionando corretamente
          </p>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
          {activeIntegrations.length > 0 ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {activeIntegrations.length > 0 ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Operacional
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Configuração Pendente
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema de integrações
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
