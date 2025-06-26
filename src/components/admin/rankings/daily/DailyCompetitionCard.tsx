
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, Trash2 } from 'lucide-react';
import { useCompetitionStatusUpdater } from '@/hooks/useCompetitionStatusUpdater';
import { formatBrasiliaDate } from '@/utils/brasiliaTimeUnified';

interface DailyCompetition {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  max_participants: number;
  total_participants: number;
  theme: string;
  rules: any;
  // Nota: prize_pool removido - competições diárias não têm prêmios
}

interface DailyCompetitionCardProps {
  competition: DailyCompetition;
  onDelete: (competition: DailyCompetition) => void;
  isDeleting: boolean;
}

export const DailyCompetitionCard: React.FC<DailyCompetitionCardProps> = ({
  competition,
  onDelete,
  isDeleting
}) => {
  // Adicionar hook para atualização automática de status
  useCompetitionStatusUpdater([competition]);

  const handleDelete = () => {
    console.log('🃏 Card: handleDelete executado para competição:', competition.id);
    onDelete(competition);
  };

  const formatDateTime = (dateString: string, isEndDate: boolean = false) => {
    const date = new Date(dateString);
    const timeFormatted = isEndDate ? '23:59:59' : '00:00:00';
    
    return `${formatBrasiliaDate(date, false)}, ${timeFormatted}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'scheduled': return 'Agendado';
      case 'completed': return 'Finalizado';
      default: return 'Rascunho';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-slate-800">{competition.title}</h4>
              <Badge className={getStatusColor(competition.status)}>
                {getStatusText(competition.status)}
              </Badge>
              {competition.theme && (
                <Badge variant="outline" className="text-xs">
                  {competition.theme}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-slate-600 mb-3">{competition.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span>Início: {formatDateTime(competition.start_date, false)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>Fim: {formatDateTime(competition.end_date, true)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">Participação Livre</span>
              </div>
            </div>

            {/* Aviso sobre ausência de prêmios */}
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <span className="text-blue-700">📝 Competição diária - Sem premiação em dinheiro</span>
            </div>
          </div>
          
          <div className="flex gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              title="Excluir competição"
              type="button"
            >
              {isDeleting ? (
                <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
