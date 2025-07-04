
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Medal } from 'lucide-react';
import { useMonthlyInviteCompetition } from '@/hooks/useMonthlyInviteCompetition';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const MyInviteRanking = () => {
  const { user } = useAuth();
  const { data } = useMonthlyInviteCompetition();
  const navigate = useNavigate();

  // Encontrar a posição do usuário atual
  const userPosition = data?.rankings?.find(ranking => ranking.user_id === user?.id);
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const handleViewRanking = () => {
    navigate('/ranking-mensal');
  };

  const getRankingColor = (position: number) => {
    if (position === 1) return 'from-yellow-400 to-yellow-600';
    if (position === 2) return 'from-gray-300 to-gray-500';
    if (position === 3) return 'from-amber-600 to-amber-800';
    if (position <= 10) return 'from-blue-400 to-blue-600';
    return 'from-purple-400 to-purple-600';
  };

  const getRankingIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    if (position <= 10) return '🏆';
    return '⭐';
  };

  if (!userPosition) {
    return (
      <Card 
        className="border-0 bg-gradient-to-r from-slate-100 to-slate-200 shadow-lg cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
        onClick={handleViewRanking}
      >
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8 text-slate-500 mr-2" />
            <TrendingUp className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-700 font-medium mb-1">Ranking de {currentMonth}</p>
          <p className="text-sm text-slate-600 mb-2">
            Faça suas primeiras indicações para entrar no ranking!
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Clique para ver o ranking completo →
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`border-0 bg-gradient-to-r ${getRankingColor(userPosition.position)} text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all transform hover:scale-105`}
      onClick={handleViewRanking}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getRankingIcon(userPosition.position)}</div>
            <div>
              <p className="text-sm opacity-90">Sua Posição</p>
              <p className="text-2xl font-bold">#{userPosition.position}</p>
            </div>
          </div>
          <Badge className="bg-white/30 text-white border-white/30 text-lg px-3 py-1">
            {userPosition.invite_points} pts
          </Badge>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Competição de {currentMonth}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm">
                  <strong>{userPosition.invites_count}</strong> convites
                </span>
                <span className="text-sm">
                  <strong>{userPosition.active_invites_count}</strong> ativos
                </span>
              </div>
            </div>
            {userPosition.prize_amount > 0 && (
              <div className="text-right">
                <p className="text-xs opacity-90">Prêmio</p>
                <p className="font-bold">R$ {userPosition.prize_amount}</p>
              </div>
            )}
          </div>
        </div>

        {userPosition.position <= 3 && (
          <div className="mt-3 text-center">
            <Medal className="w-5 h-5 inline mr-2" />
            <span className="text-sm font-medium">
              🎉 Parabéns! Você está no pódio!
            </span>
          </div>
        )}
        
        <div className="mt-3 text-center">
          <p className="text-xs opacity-75 font-medium">
            Clique para ver o ranking completo →
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyInviteRanking;
