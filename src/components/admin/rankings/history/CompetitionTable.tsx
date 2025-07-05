
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History as HistoryIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { CompetitionTableRow } from './CompetitionTableRow';
import { handleExportWinners } from './CompetitionExportService';
import { CompetitionHistoryItem, CompetitionTableProps } from './types';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

export const CompetitionTable: React.FC<CompetitionTableProps> = ({ competitions, onReload }) => {
  const { toast } = useToast();
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleViewCompetition = (competition: CompetitionHistoryItem) => {
    // Since CompetitionDetailsModal was removed, we can show a toast or handle differently
    logger.info('👁️ Visualizando competição:', {
      id: competition.id,
      title: competition.title,
      status: competition.status,
      timestamp: getCurrentBrasiliaTime()
    }, 'COMPETITION_TABLE');
    
    toast({
      title: "Competição selecionada",
      description: `${competition.title} - ${competition.status}`,
    });
  };

  const onExportWinners = (competition: CompetitionHistoryItem) => {
    logger.info('📤 Exportando vencedores:', {
      id: competition.id,
      title: competition.title,
      timestamp: getCurrentBrasiliaTime()
    }, 'COMPETITION_TABLE');
    
    handleExportWinners(competition, toast, setExportingId);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
        <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
          <HistoryIcon className="h-5 w-5 text-orange-600" />
          Histórico de Competições ({competitions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Competição</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Período</TableHead>
                <TableHead className="font-semibold">Prêmio</TableHead>
                <TableHead className="font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitions.map((competition) => (
                <CompetitionTableRow
                  key={competition.id}
                  competition={competition}
                  onViewCompetition={handleViewCompetition}
                  onExportWinners={onExportWinners}
                  exportingId={exportingId}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {competitions.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <HistoryIcon className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium mb-2">Nenhuma competição finalizada encontrada</p>
            <p className="text-sm">
              As competições aparecerão aqui quando forem finalizadas. Crie uma nova competição para começar!
            </p>
            <Button 
              className="mt-4" 
              onClick={onReload}
              variant="outline"
            >
              🔄 Recarregar dados
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
