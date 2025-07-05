
import React, { useMemo, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CompetitionCard from './CompetitionCard';
import EmptyCompetitionsState from './EmptyCompetitionsState';
import { Competition } from '@/types';
import { cleanupInactiveCompetitionIcons } from '@/utils/competitionIcons';
import { logger } from '@/utils/logger';

interface CompetitionsListProps {
  competitions: Competition[];
  onStartChallenge: (challengeId: string) => void;
  onRefresh: () => void;
}

const CompetitionsList = ({ competitions, onStartChallenge, onRefresh }: CompetitionsListProps) => {
  // Filtrar e ordenar competições
  const { activeCompetitions, scheduledCompetitions } = useMemo(() => {
    const active = competitions.filter(comp => comp.status === 'active');
    
    // Ordenar competições agendadas por tempo restante (menor para maior)
    const scheduled = competitions
      .filter(comp => comp.status === 'scheduled')
      .sort((a, b) => {
        const now = new Date().getTime();
        const timeToA = new Date(a.start_date).getTime() - now;
        const timeToB = new Date(b.start_date).getTime() - now;
        
        // Ordenar do menor tempo restante para o maior
        return timeToA - timeToB;
      })
      .slice(0, 3); // Limitar a 3 competições agendadas
    
    return { activeCompetitions: active, scheduledCompetitions: scheduled };
  }, [competitions]);

  // Limpar ícones de competições inativas sempre que a lista mudar
  useEffect(() => {
    const allActiveCompetitionIds = [...activeCompetitions, ...scheduledCompetitions].map(comp => comp.id);
    cleanupInactiveCompetitionIcons(allActiveCompetitionIds);
  }, [activeCompetitions, scheduledCompetitions]);

  const handleJoin = (competitionId: string) => {
    onStartChallenge(competitionId);
  };

  const handleViewRanking = (competitionId: string) => {
    logger.info('Ver ranking da competição:', { competitionId }, 'COMPETITIONS_LIST');
  };

  const totalCompetitions = activeCompetitions.length + scheduledCompetitions.length;

  if (totalCompetitions === 0) {
    return (
      <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-lg">
        <CardContent className="p-3">
          <EmptyCompetitionsState onRefresh={onRefresh} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competições Ativas */}
      {activeCompetitions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-semibold text-lg">Competições Ativas</h2>
            <Button onClick={onRefresh} variant="ghost" size="sm" className="h-8 w-8 p-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-0">
            {activeCompetitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                onJoin={handleJoin}
                onViewRanking={handleViewRanking}
              />
            ))}
          </div>
        </div>
      )}

      {/* Próximas Competições (Agendadas) */}
      {scheduledCompetitions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-800 font-semibold text-lg">Próximas Competições</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md border border-gray-100">
            {scheduledCompetitions.map((competition, index) => (
              <div key={competition.id}>
                <div className="px-4">
                  <CompetitionCard
                    competition={competition}
                    onJoin={handleJoin}
                    onViewRanking={handleViewRanking}
                  />
                </div>
                {index < scheduledCompetitions.length - 1 && (
                  <div className="border-b border-gray-100 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionsList;
