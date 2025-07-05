
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock, Trash2 } from 'lucide-react';
import { 
  getStatusText, 
  getStatusColor, 
  formatDateTimeBrasilia 
} from '@/utils/dynamicCompetitionStatus';
import { logger } from '@/utils/logger';

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
  // 🎯 CONFIAR COMPLETAMENTE NO STATUS DO BANCO
  const status = competition.status as 'scheduled' | 'active' | 'completed';

  const handleDelete = () => {
    logger.info('🃏 Card: handleDelete executado para competição:', { competitionId: competition.id }, 'DAILY_COMPETITION_CARD');
    onDelete(competition);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-slate-800">{competition.title}</h4>
              
              {/* Status direto do banco */}
              <Badge className={getStatusColor(status)}>
                {getStatusText(status)}
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
                <span>Início: {formatDateTimeBrasilia(competition.start_date)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>Fim: {formatDateTimeBrasilia(competition.end_date)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">Participação Livre</span>
              </div>
            </div>

            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <span className="text-blue-700">📝 Status do banco: {getStatusText(status)} - Horários em Brasília</span>
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
