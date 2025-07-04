import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, Trophy, Calendar } from 'lucide-react';

interface MonthlyInviteStatsCardsProps {
  stats: {
    totalParticipants: number;
    totalPrizePool: number;
    topPerformers?: any[];
  };
  rankings: any[];
  competition: {
    id?: string;
    status?: string;
    total_prize_pool?: number;
  } | null;
}

export const MonthlyInviteStatsCards = ({ stats, rankings, competition }: MonthlyInviteStatsCardsProps) => {
  const totalParticipants = stats?.totalParticipants || 0;
  // Usar o valor da competição ou das stats, priorizando o da competição
  const totalPrizePool = competition?.total_prize_pool || stats?.totalPrizePool || 0;
  const winnersCount = rankings?.filter((r: any) => r.prize_amount > 0).length || 0;
  const competitionStatus = competition?.status || 'inactive';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">
            {totalParticipants}
          </div>
          <div className="text-sm text-gray-600">Participantes</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">
            R$ {totalPrizePool.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Prêmios</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-amber-600">
            {winnersCount}
          </div>
          <div className="text-sm text-gray-600">Ganhadores</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">
            {competitionStatus === 'active' ? 'Ativa' : 
             competitionStatus === 'completed' ? 'Finalizada' : 
             competitionStatus === 'scheduled' ? 'Agendada' : 'Inativa'}
          </div>
          <div className="text-sm text-gray-600">Status</div>
        </CardContent>
      </Card>
    </div>
  );
};