
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Trophy, DollarSign } from 'lucide-react';
import { WeeklyCompetitionActions } from './WeeklyCompetitionActions';
import { useCompetitionStatusUpdater } from '@/hooks/useCompetitionStatusUpdater';

interface WeeklyCompetition {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  prize_pool: number;
  max_participants: number;
  total_participants: number;
}

interface WeeklyCompetitionCardProps {
  competition: WeeklyCompetition;
  onViewRanking: (competition: WeeklyCompetition) => void;
  onEdit: (competition: WeeklyCompetition) => void;
  onDelete: (competition: WeeklyCompetition) => void;
  deletingId: string | null;
}

export const WeeklyCompetitionCard: React.FC<WeeklyCompetitionCardProps> = ({
  competition,
  onViewRanking,
  onEdit,
  onDelete,
  deletingId
}) => {
  // Adicionar hook para atualização automática de status
  useCompetitionStatusUpdater([competition]);

  console.log('🃏 WeeklyCard: Props recebidas para competição:', {
    id: competition.id,
    title: competition.title,
    hasOnEdit: !!onEdit,
    hasOnDelete: !!onDelete,
    hasOnViewRanking: !!onViewRanking,
    deletingId
  });

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            </div>
            
            <p className="text-sm text-slate-600 mb-3">{competition.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span>Início: {formatDateTime(competition.start_date)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span>Fim: {formatDateTime(competition.end_date)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">R$ {competition.prize_pool.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-blue-600" />
                <span>
                  {competition.total_participants || 0}
                  {competition.max_participants > 0 && ` / ${competition.max_participants}`}
                </span>
              </div>
            </div>
          </div>
          
          <WeeklyCompetitionActions
            competition={competition}
            onViewRanking={onViewRanking}
            onEdit={onEdit}
            onDelete={onDelete}
            deletingId={deletingId}
          />
        </div>
      </CardContent>
    </Card>
  );
};
