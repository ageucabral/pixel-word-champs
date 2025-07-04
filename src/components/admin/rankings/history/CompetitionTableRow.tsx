
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Download } from 'lucide-react';
import { CompetitionStatusBadge } from './CompetitionStatusBadge';
import { CompetitionTypeBadge } from './CompetitionTypeBadge';
import { formatDate, getWeekFromDate } from './competitionUtils';
import { formatISOToBrazilian } from '@/utils/brazilianDateFormatter';
import { CompetitionHistoryItem } from './types';

interface CompetitionTableRowProps {
  competition: CompetitionHistoryItem;
  onViewCompetition: (competition: CompetitionHistoryItem) => void;
  onExportWinners: (competition: CompetitionHistoryItem) => void;
  exportingId: string | null;
}

export const CompetitionTableRow: React.FC<CompetitionTableRowProps> = ({
  competition,
  onViewCompetition,
  onExportWinners,
  exportingId
}) => {
  const isDailyCompetition = competition.competition_type === 'challenge';

  return (
    <TableRow key={competition.id} className="hover:bg-slate-50">
      <TableCell>
        <div>
          <p className="font-medium text-slate-900">{competition.title}</p>
          {competition.competition_type === 'weekly' && (
            <p className="text-xs text-slate-500">
              Semana {getWeekFromDate(competition.start_date)} de {new Date(competition.start_date).getFullYear()}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <CompetitionTypeBadge type={competition.competition_type} />
      </TableCell>
      <TableCell>
        <CompetitionStatusBadge status={competition.status} />
      </TableCell>
      <TableCell className="text-sm">
        <div>
          {/* CORRIGIDO: Usar formatDate que já converte UTC → Brasília */}
          <p>{formatISOToBrazilian(competition.start_date)} -</p>
          <p>{formatISOToBrazilian(competition.end_date)}</p>
        </div>
      </TableCell>
      <TableCell className="font-semibold text-green-600">
        R$ {competition.prize_pool.toFixed(2)}
      </TableCell>
      <TableCell className="text-center">
        {isDailyCompetition ? (
          <span className="text-xs text-slate-400">Sem ações</span>
        ) : (
          <div className="flex gap-2 justify-center">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              onClick={() => onViewCompetition(competition)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Ver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => onExportWinners(competition)}
              disabled={exportingId === competition.id}
            >
              {exportingId === competition.id ? (
                <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-1" />
              ) : (
                <Download className="h-3 w-3 mr-1" />
              )}
              Exportar
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};
