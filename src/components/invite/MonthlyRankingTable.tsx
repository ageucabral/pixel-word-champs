import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Star } from 'lucide-react';
import { useMonthlyInviteCompetitionSimplified } from '@/hooks/useMonthlyInviteCompetitionSimplified';
import { useAuth } from '@/hooks/useAuth';

const MonthlyRankingTable = () => {
  const { data, isLoading } = useMonthlyInviteCompetitionSimplified();
  const { user } = useAuth();

  if (isLoading || !data?.rankings?.length) {
    return null;
  }

  const getRankingIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (position === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (position === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <Star className="w-4 h-4 text-purple-400" />;
  };

  const getRankingBg = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200";
    if (position === 1) return "bg-gradient-to-r from-yellow-50 to-orange-50";
    if (position === 2) return "bg-gradient-to-r from-gray-50 to-slate-50";
    if (position === 3) return "bg-gradient-to-r from-amber-50 to-yellow-50";
    return "bg-white hover:bg-slate-50";
  };

  // Mostrar top 10 + posição do usuário se não estiver no top 10
  const topRankings = data.rankings.slice(0, 10);
  const userRanking = data.rankings.find(r => r.user_id === user?.id);
  const showUserSeparately = userRanking && userRanking.position > 10;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Trophy className="w-5 h-5 text-amber-500" />
          Ranking da Competição
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {topRankings.map((ranking, index) => {
            const isCurrentUser = ranking.user_id === user?.id;
            return (
              <div
                key={ranking.user_id}
                className={`flex items-center justify-between p-3 mx-4 rounded-lg border transition-all ${getRankingBg(ranking.position, isCurrentUser)} ${
                  isCurrentUser ? 'ring-2 ring-blue-300 shadow-md' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-[60px]">
                    {getRankingIcon(ranking.position)}
                    <span className={`font-bold text-sm ${
                      ranking.position <= 3 ? 'text-slate-700' : 'text-slate-600'
                    }`}>
                      #{ranking.position}
                    </span>
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${
                      isCurrentUser ? 'text-blue-700' : 'text-slate-700'
                    }`}>
                      {ranking.username}
                      {isCurrentUser && <span className="text-blue-500 ml-1">(Você)</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ranking.invites_count} convites • {ranking.active_invites_count} ativos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-700">
                    {ranking.invite_points} pts
                  </p>
                  {ranking.prize_amount > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      R$ {ranking.prize_amount}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {showUserSeparately && userRanking && (
            <>
              <div className="flex items-center justify-center py-2">
                <div className="h-px bg-slate-300 flex-1 mx-4"></div>
                <span className="text-xs text-slate-500 px-2">...</span>
                <div className="h-px bg-slate-300 flex-1 mx-4"></div>
              </div>
              <div className="flex items-center justify-between p-3 mx-4 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 ring-2 ring-blue-300 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <Star className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-sm text-slate-700">
                      #{userRanking.position}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-blue-700">
                      {userRanking.username}
                      <span className="text-blue-500 ml-1">(Você)</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {userRanking.invites_count} convites • {userRanking.active_invites_count} ativos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-slate-700">
                    {userRanking.invite_points} pts
                  </p>
                  {userRanking.prize_amount > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      R$ {userRanking.prize_amount}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {data.rankings.length > 10 && (
          <p className="text-center text-xs text-slate-500 py-3">
            Mostrando top 10 de {data.rankings.length} participantes
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyRankingTable;