
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Settings, Zap, RefreshCw } from 'lucide-react';
import { useWeeklyCompetitionDiagnostic } from '@/hooks/useWeeklyCompetitionDiagnostic';
import { useToast } from '@/hooks/use-toast';

export const WeeklyAutomationStatus = () => {
  const { 
    diagnostic, 
    isChecking, 
    isActivating, 
    runDiagnostic, 
    forceActivation 
  } = useWeeklyCompetitionDiagnostic();
  const { toast } = useToast();

  useEffect(() => {
    runDiagnostic();
  }, []);

  const handleForceActivation = async () => {
    const result = await forceActivation();
    
    if (result.success) {
      toast({
        title: "Ativação bem-sucedida",
        description: `${result.data?.updated_count || 0} competições foram atualizadas.`,
      });
    } else {
      toast({
        title: "Erro na ativação",
        description: result.error || "Falha ao ativar competições",
        variant: "destructive",
      });
    }
  };

  const needsActivation = diagnostic?.hasScheduledCompetitions && !diagnostic?.hasActiveCompetition;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Ativação Necessária */}
      {needsActivation && (
        <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Ativação Necessária
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
              <p className="text-xs text-blue-700">
                Competições agendadas precisam ser ativadas manualmente
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Status</span>
                <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-100">
                  Pendente
                </Badge>
              </div>

              <Button
                onClick={handleForceActivation}
                disabled={isActivating}
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isActivating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Ativando...
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 mr-1" />
                    Ativar Competições
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sistema de Finalização Automática */}
      <Card className={`border-green-200 bg-green-50 ${!needsActivation ? 'lg:col-span-2' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Sistema de Finalização Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Status do Sistema</span>
              <Badge variant="outline" className="border-green-300 text-green-700 bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Execução Diária</span>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Clock className="h-3 w-3" />
                00:01 (Brasília)
              </div>
            </div>
            
            <div className="bg-green-100 p-1.5 rounded-md">
              <p className="text-xs text-green-700">
                <Settings className="h-3 w-3 inline mr-1" />
                Verifica automaticamente competições vencidas e executa finalização, 
                criando snapshots e ativando a próxima competição agendada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
