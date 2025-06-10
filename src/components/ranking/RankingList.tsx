
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Crown, Medal, Award } from 'lucide-react';

interface RankingPlayer {
  position: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  score: number;
  prize?: number;
}

interface RankingListProps {
  weeklyRanking: RankingPlayer[];
  user: any;
  totalWeeklyPlayers: number;
  weeklyCompetition: any;
  getPrizeAmount: (position: number) => number;
}

const RankingList = ({ weeklyRanking, user, totalWeeklyPlayers, weeklyCompetition, getPrizeAmount }: RankingListProps) => {
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2: return <Medal className="w-4 h-4 text-gray-400" />;
      case 3: return <Award className="w-4 h-4 text-orange-500" />;
      default: return (
        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
          {position}
        </div>
      );
    }
  };

  const getRowStyle = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return 'bg-blue-50 border-l-2 border-blue-500';
    }
    
    switch (position) {
      case 1: return "bg-yellow-50";
      case 2: return "bg-gray-50";
      case 3: return "bg-orange-50";
      default: return "bg-white hover:bg-gray-50";
    }
  };

  // Filtrar duplicatas baseado no user_id E position para evitar duplicações
  const uniqueRanking = weeklyRanking.filter((player, index, self) => 
    index === self.findIndex(p => p.user_id === player.user_id)
  );

  console.log('🔍 Ranking original:', weeklyRanking.length, 'items');
  console.log('🔍 Ranking após filtro:', uniqueRanking.length, 'items');

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          📊 Classificação
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {uniqueRanking.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium">Nenhum jogador no ranking</p>
            <p className="text-sm">Seja o primeiro a pontuar!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {uniqueRanking.slice(0, 50).map((player, index) => {
              const isCurrentUser = user?.id === player.user_id;
              const prizeAmount = getPrizeAmount(player.position);
              
              return (
                <div 
                  key={`${player.user_id}-${index}`}
                  className={`flex items-center justify-between p-3 ${getRowStyle(player.position, isCurrentUser)}`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(player.position)}
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {player.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {isCurrentUser ? 'Você' : player.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        #{player.position} • {player.score.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {player.score.toLocaleString()}
                    </div>
                    {prizeAmount > 0 && (
                      <div className="text-sm text-green-600 font-semibold">
                        R$ {prizeAmount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RankingList;
