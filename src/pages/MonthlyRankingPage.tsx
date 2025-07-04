import React from 'react';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { useMonthlyInviteCompetitionSimplified } from '@/hooks/useMonthlyInviteCompetitionSimplified';
import { useAuth } from '@/hooks/useAuth';

interface MonthlyRankingEntry {
  user_id: string;
  username: string;
  position: number;
  invite_points: number;
  prize_amount: number;
}

const MonthlyRankingPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useMonthlyInviteCompetitionSimplified();
  const { user } = useAuth();

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return position.toString();
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-600 bg-yellow-50';
    if (position === 2) return 'text-gray-600 bg-gray-50';
    if (position === 3) return 'text-orange-600 bg-orange-50';
    return 'text-slate-600 bg-slate-50';
  };

  const isCurrentUser = (entryUserId: string) => entryUserId === user?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold">Ranking Mensal de Indicação</h1>
            <div className="w-9" />
          </div>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.rankings?.length) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold">Ranking Mensal de Indicação</h1>
            <div className="w-9" />
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Nenhum participante</h3>
                  <p className="text-sm text-muted-foreground">
                    Seja o primeiro a aparecer no ranking!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Ranking Mensal de Indicação</h1>
          <div className="w-9" />
        </div>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                {currentMonth}
              </span>
              <Badge variant="secondary" className="text-xs">
                {data.rankings.length} participantes
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Ranking List */}
        <div className="space-y-3">
          {data.rankings.map((entry: MonthlyRankingEntry) => {
            const userIsCurrentUser = isCurrentUser(entry.user_id);
            
            return (
              <Card 
                key={entry.user_id}
                className={`${userIsCurrentUser ? 'border-primary bg-primary/5' : ''} transition-colors`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Position */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${getPositionColor(entry.position)}`}>
                      {getPositionIcon(entry.position)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{entry.username}</span>
                        {userIsCurrentUser && (
                          <Badge variant="default" className="text-xs px-2 py-0">
                            Você
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.invite_points} pontos
                      </div>
                    </div>

                    {/* Prize */}
                    {entry.prize_amount > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">
                          R$ {entry.prize_amount.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonthlyRankingPage;