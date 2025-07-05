
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users, DollarSign, Settings, Eye, Download, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { rankingExportService } from '@/services/rankingExportService';
import { useRankings } from '@/hooks/useRankings';
import { logger } from '@/utils/logger';

interface RankingInfoCardProps {
  type: 'daily' | 'weekly';
  title: string;
  description: string;
  status: 'active' | 'inactive';
  lastUpdate: string;
}

export const RankingInfoCard = ({ 
  type, 
  title, 
  description, 
  lastUpdate 
}: RankingInfoCardProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const { dailyRanking, weeklyRanking } = useRankings();
  
  const isDaily = type === 'daily';
  const iconColor = isDaily ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-purple-600';
  
  // Usar dados reais dos rankings
  const participants = isDaily ? dailyRanking.length : weeklyRanking.length;
  const prizePool = isDaily ? 0 : weeklyRanking.slice(0, 10).reduce((total, _, index) => {
    if (index === 0) return total + 100;
    if (index === 1) return total + 50;
    if (index === 2) return total + 25;
    if (index <= 9) return total + 10;
    return total;
  }, 0);

  const handleView = () => {
    toast({
      title: "Visualizar Ranking",
      description: `Abrindo detalhes do ranking ${isDaily ? 'diário' : 'semanal'}...`,
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Para ambos os tipos, exportar apenas ranking semanal
      const data = await rankingExportService.exportWeeklyRankings();
      const filename = `ranking_${isDaily ? 'diario' : 'semanal'}_${new Date().toISOString().split('T')[0]}.csv`;

      if (data.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há dados de ranking para exportar.",
          variant: "destructive",
        });
        return;
      }

      rankingExportService.exportToCSV(data, filename);
      
      toast({
        title: "Exportação concluída",
        description: `${data.length} registros exportados com sucesso.`,
      });
    } catch (error) {
      logger.error('Erro ao exportar ranking:', { error }, 'RANKING_INFO_CARD');
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados do ranking.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfig = () => {
    toast({
      title: "Configurações",
      description: `Abrindo configurações do ranking ${isDaily ? 'diário' : 'semanal'}...`,
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`bg-gradient-to-r ${iconColor} p-2.5 rounded-lg shadow-sm`}>
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
              <p className="text-sm text-slate-600 mt-1">{description}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Participantes</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{participants.toLocaleString('pt-BR')}</p>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {isDaily ? (
                <>
                  <ArrowRight className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-600">Transfere Pontos</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-600">Prêmio Total</span>
                </>
              )}
            </div>
            {isDaily ? (
              <p className="text-lg font-bold text-blue-600">Para Semanal</p>
            ) : (
              <p className="text-xl font-bold text-slate-900">R$ {prizePool.toLocaleString('pt-BR')}</p>
            )}
          </div>
        </div>

        {/* Informação específica do tipo - mantendo layout existente */}
        {isDaily ? (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">Sistema Diário</p>
                <p className="text-blue-700">Os pontos são zerados diariamente e transferidos automaticamente para o ranking semanal.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-start gap-2">
              <Trophy className="h-4 w-4 text-purple-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-purple-800 mb-1">Sistema Semanal</p>
                <p className="text-purple-700">Acumula pontos durante a semana com premiação automática no final.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>Atualizado: {lastUpdate}</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              onClick={handleView}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-1" />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-slate-600 hover:text-slate-700 hover:bg-slate-50 border-slate-200"
              onClick={handleConfig}
            >
              <Settings className="h-4 w-4 mr-1" />
              Config
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
