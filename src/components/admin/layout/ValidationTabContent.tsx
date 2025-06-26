
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw, Clock, Shield } from 'lucide-react';
import { TimeValidationPanel } from '../validation/TimeValidationPanel';
import { useTimeSystemValidation } from '@/hooks/useTimeSystemValidation';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';

export const ValidationTabContent: React.FC = () => {
  const { 
    checks, 
    isValidating, 
    systemHealthy, 
    runValidation 
  } = useTimeSystemValidation();

  const passedChecks = checks.filter(check => check.status === 'pass').length;
  const totalChecks = checks.length;

  return (
    <div className="space-y-6">
      {/* Header de Status */}
      <Card className={`border-2 ${
        systemHealthy === true ? 'border-green-200 bg-green-50' : 
        systemHealthy === false ? 'border-red-200 bg-red-50' : 
        'border-yellow-200 bg-yellow-50'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status do Sistema de Tempo Unificado
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runValidation}
              disabled={isValidating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
              {isValidating ? 'Validando...' : 'Revalidar'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge 
                variant={
                  systemHealthy === true ? 'default' : 
                  systemHealthy === false ? 'destructive' : 
                  'secondary'
                }
                className="text-sm"
              >
                {systemHealthy === true ? '✅ Sistema Saudável' : 
                 systemHealthy === false ? '❌ Problemas Detectados' : 
                 '⏳ Validando...'}
              </Badge>
              <span className="text-sm text-gray-600">
                {passedChecks}/{totalChecks} verificações passaram
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Última verificação: {getCurrentBrasiliaTime()}
            </div>
          </div>

          {/* Lista de Verificações */}
          <div className="space-y-2">
            {checks.map((check, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg bg-white border"
              >
                {check.status === 'pass' ? (
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : check.status === 'fail' ? (
                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{check.name}</p>
                  <p className="text-xs text-gray-600 truncate">{check.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>🎯 Sistema Unificado:</strong> Input = Preview = Exibição (todos em Brasília), UTC apenas para storage interno.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Esta validação garante que não há conversões incorretas ou perda de precisão temporal.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Painel de Validação Completa */}
      <TimeValidationPanel />
    </div>
  );
};
