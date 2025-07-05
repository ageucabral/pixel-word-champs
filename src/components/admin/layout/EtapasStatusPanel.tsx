// PAINEL DE STATUS DAS ETAPAS PARA ADMINISTRAÇÃO
// Componente para visualizar o progresso das 5 etapas no painel admin

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, AlertCircle, RefreshCw } from 'lucide-react';
import { FinalVerification } from '@/utils/finalizeEtapas4e5';
import { useOptimizedSystemIntegration } from '@/hooks/useOptimizedSystemIntegration';
import { logger } from '@/utils/logger';

interface EtapaStatus {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  percentage: number;
  details?: any;
}

export const EtapasStatusPanel: React.FC = () => {
  const [etapas, setEtapas] = useState<EtapaStatus[]>([
    {
      id: 1,
      name: 'Sistema de Pontuação',
      description: 'Pontuação otimizada e cálculos de XP',
      completed: true,
      percentage: 100
    },
    {
      id: 2,
      name: 'Validação Bidirecional',
      description: 'Palavras em ambas as direções',
      completed: true,
      percentage: 100
    },
    {
      id: 3,
      name: 'Sistema de Dicas',
      description: 'Dicas inteligentes para palavras',
      completed: true,
      percentage: 100
    },
    {
      id: 4,
      name: 'Otimização Completa',
      description: 'Cache, performance e monitoramento',
      completed: false,
      percentage: 85
    },
    {
      id: 5,
      name: 'Estratégias por Nível',
      description: 'Tabuleiros únicos por nível',
      completed: false,
      percentage: 70
    }
  ]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [lastVerification, setLastVerification] = useState<Date | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Hook de integração do sistema para Etapa 4
  const { getSystemStatus, refresh: refreshSystem } = useOptimizedSystemIntegration();

  // Executar verificação completa
  const runVerification = async () => {
    setIsVerifying(true);
    logger.info('🔍 Iniciando verificação completa das etapas 4 e 5', {}, 'ETAPAS_STATUS');

    try {
      const result = await FinalVerification.runCompleteVerification();
      
      setVerificationResult(result);
      setLastVerification(new Date());

      // Atualizar status das etapas 4 e 5
      setEtapas(prev => prev.map(etapa => {
        if (etapa.id === 4) {
          return {
            ...etapa,
            completed: result.etapa4.completed,
            percentage: result.etapa4.percentage,
            details: result.etapa4
          };
        }
        if (etapa.id === 5) {
          return {
            ...etapa,
            completed: result.etapa5.completed,
            percentage: result.etapa5.percentage,
            details: result.etapa5
          };
        }
        return etapa;
      }));

      logger.info('✅ Verificação completa finalizada', {
        overallComplete: result.overallComplete,
        finalPercentage: result.finalPercentage
      }, 'ETAPAS_STATUS');

    } catch (error) {
      logger.error('❌ Erro na verificação das etapas', { error }, 'ETAPAS_STATUS');
    } finally {
      setIsVerifying(false);
    }
  };

  // Atualizar status da Etapa 4 baseado no sistema
  useEffect(() => {
    const systemStatus = getSystemStatus();
    const isEtapa4Complete = systemStatus === 'healthy';
    
    setEtapas(prev => prev.map(etapa => {
      if (etapa.id === 4) {
        return {
          ...etapa,
          completed: isEtapa4Complete,
          percentage: isEtapa4Complete ? 100 : 90,
          details: { systemStatus }
        };
      }
      return etapa;
    }));
  }, [getSystemStatus]);

  // Calcular progresso geral
  const overallProgress = Math.round(etapas.reduce((sum, etapa) => sum + etapa.percentage, 0) / etapas.length);
  const completedEtapas = etapas.filter(e => e.completed).length;

  const getStatusIcon = (etapa: EtapaStatus) => {
    if (etapa.completed) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (etapa.percentage >= 70) {
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusBadge = (etapa: EtapaStatus) => {
    if (etapa.completed) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Completa</Badge>;
    }
    if (etapa.percentage >= 85) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Finalizando</Badge>;
    }
    if (etapa.percentage >= 70) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Em Progresso</Badge>;
    }
    return <Badge variant="outline" className="text-gray-600">Pendente</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header com progresso geral */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-900">
                Status das 5 Etapas do Sistema
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Progresso geral: {completedEtapas}/5 etapas ({overallProgress}%)
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastVerification && (
                <span className="text-xs text-gray-500">
                  Última verificação: {lastVerification.toLocaleTimeString()}
                </span>
              )}
              <Button
                onClick={runVerification}
                disabled={isVerifying}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>
          </div>
          
          {/* Barra de progresso geral */}
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Lista de etapas */}
      <div className="grid gap-4">
        {etapas.map((etapa) => (
          <Card key={etapa.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(etapa)}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Etapa {etapa.id}: {etapa.name}
                    </h3>
                    <p className="text-sm text-gray-600">{etapa.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {etapa.percentage}%
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${etapa.percentage}%` }}
                      />
                    </div>
                  </div>
                  {getStatusBadge(etapa)}
                </div>
              </div>

              {/* Detalhes específicos das etapas 4 e 5 */}
              {etapa.details && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Detalhes:</h4>
                  {etapa.id === 4 && etapa.details.systemStatus && (
                    <div className="text-xs text-gray-600">
                      Status do Sistema: <span className="font-medium">{etapa.details.systemStatus}</span>
                    </div>
                  )}
                  {etapa.id === 5 && etapa.details.tests && (
                    <div className="space-y-1">
                      {Object.entries(etapa.details.tests).map(([test, result]) => (
                        <div key={test} className="flex items-center gap-2 text-xs">
                          {result === true ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : result === false ? (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          ) : (
                            <Circle className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="capitalize">{test.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resultado da verificação */}
      {verificationResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Resultado da Verificação</h3>
            </div>
            <div className="text-sm text-green-800">
              {verificationResult.overallComplete ? (
                <p>🎉 <strong>Todas as 5 etapas estão 100% concluídas!</strong></p>
              ) : (
                <p>
                  Progresso atual: {verificationResult.finalPercentage.toFixed(1)}%
                  <br />
                  Etapa 4: {verificationResult.etapa4.percentage}% | 
                  Etapa 5: {verificationResult.etapa5.percentage}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};