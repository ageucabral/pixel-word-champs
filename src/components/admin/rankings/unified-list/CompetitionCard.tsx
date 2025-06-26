
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Trash2, Clock } from 'lucide-react';
import { UnifiedCompetition } from '@/types/competition';
import { 
  getStatusText, 
  getStatusColor, 
  formatDateTimeBrasilia 
} from '@/utils/dynamicCompetitionStatus';

interface CompetitionCardProps {
  competition: UnifiedCompetition;
  onDelete: (competition: UnifiedCompetition) => void;
  isDeleting: boolean;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  onDelete,
  isDeleting
}) => {
  // 🎯 CONFIAR COMPLETAMENTE NO STATUS DO BANCO
  const status = competition.status as 'scheduled' | 'active' | 'completed';

  const calculateAndDisplayDuration = () => {
    // Priorizar duração fornecida
    if (competition.duration && competition.duration > 0) {
      return `${competition.duration}h`;
    }
    
    // Calcular duração baseada nas datas UTC
    if (competition.startDate && competition.endDate) {
      try {
        const start = new Date(competition.startDate);
        const end = new Date(competition.endDate);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.round(diffMs / (1000 * 60 * 60));
        
        return `${hours}h`;
      } catch (error) {
        console.error('Erro ao calcular duração:', error);
        return 'N/A';
      }
    }
    
    return 'N/A';
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span>Início: {formatDateTimeBrasilia(competition.startDate)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span>Fim: {formatDateTimeBrasilia(competition.endDate)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-blue-600 font-medium">
                  Duração: {calculateAndDisplayDuration()}
                </span>
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
              onClick={() => onDelete(competition)}
              disabled={isDeleting}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              title="Excluir competição"
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
