import React from 'react';
import { ArrowLeft, Trophy, Users, Medal, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMonthlyInviteCompetitionSimplified } from '@/hooks/useMonthlyInviteCompetitionSimplified';
import { useAuth } from '@/hooks/useAuth';

interface MonthlyRankingEntry {
  user_id: string;
  username: string;
  position: number;
  invite_points: number;
  invites_count: number;
  active_invites_count: number;
  prize_amount: number;
  payment_status: string;
  pix_key?: string;
  pix_holder_name?: string;
}

const MonthlyRankingPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useMonthlyInviteCompetitionSimplified();
  const { user } = useAuth();

  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const getPositionBadge = (position: number) => {
    switch (position) {
      case 1:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🥇 1º</Badge>;
      case 2:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">🥈 2º</Badge>;
      case 3:
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">🥉 3º</Badge>;
      default:
        return <Badge variant="outline">{position}º</Badge>;
    }
  };

  const getPrizeDisplay = (amount: number, position: number) => {
    if (amount <= 0) return null;
    
    const getBadgeStyle = () => {
      if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 shadow-lg';
      if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white border-0 shadow-lg';
      if (position === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0 shadow-lg';
      return 'bg-gradient-to-r from-green-400 to-green-600 text-white border-0 shadow-lg';
    };

    return (
      <Badge className={`${getBadgeStyle()} animate-pulse`}>
        💰 R$ {amount.toFixed(2)}
      </Badge>
    );
  };

  const isCurrentUser = (entryUserId: string) => entryUserId === user?.id;

  const getRankingIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    if (position <= 10) return '🏆';
    return '⭐';
  };

  const getRankingColor = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'border-blue-500 bg-blue-50';
    if (position === 1) return 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50';
    if (position === 2) return 'border-gray-300 bg-gradient-to-r from-gray-50 to-slate-50';
    if (position === 3) return 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50';
    return 'border-slate-200 bg-white';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 px-3 py-4 pb-20">
        <div className="max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-lg font-bold text-slate-900 truncate">Ranking</span>
            </div>
          </div>
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.rankings?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 px-3 py-4 pb-20">
        <div className="max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-lg font-bold text-slate-900 truncate">Ranking - {currentMonth}</span>
            </div>
          </div>
          
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Nenhum participante ainda</h3>
                  <p className="text-sm text-slate-500">
                    Seja o primeiro a fazer indicações e aparecer no ranking mensal!
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 px-3 py-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span className="text-lg font-bold text-slate-900">Ranking</span>
          </div>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        {/* Month and Stats */}
        <div className="text-center mb-4">
          <h2 className="text-sm font-medium text-slate-600 mb-1">{currentMonth}</h2>
          <Badge variant="outline" className="text-xs">
            {data.rankings.length} participantes
          </Badge>
        </div>

        {/* Mobile Card Layout */}
        <div className="space-y-4">
          {data.rankings.map((entry: MonthlyRankingEntry) => {
            const userIsCurrentUser = isCurrentUser(entry.user_id);
            const cardStyle = userIsCurrentUser 
              ? 'border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-xl scale-105 transform hover:scale-110' 
              : entry.position <= 3 
                ? 'border-2 bg-gradient-to-r shadow-xl hover:shadow-2xl hover:scale-105 transform' 
                : 'border bg-white shadow-lg hover:shadow-xl hover:scale-105 transform';
            
            const getBorderGradient = () => {
              if (userIsCurrentUser) return '';
              if (entry.position === 1) return 'border-yellow-400 from-yellow-50 to-amber-50';
              if (entry.position === 2) return 'border-gray-400 from-gray-50 to-slate-50';
              if (entry.position === 3) return 'border-orange-400 from-orange-50 to-amber-50';
              return '';
            };

            return (
              <Card 
                key={entry.user_id}
                className={`${cardStyle} ${getBorderGradient()} transition-all duration-300 animate-fade-in relative overflow-hidden`}
              >
                {/* Sparkle effect for top 3 */}
                {entry.position <= 3 && (
                  <div className="absolute top-2 right-2 animate-pulse">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </div>
                )}
                
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Enhanced Position Display */}
                    <div className="flex flex-col items-center min-w-[70px]">
                      <div className="text-4xl mb-2 animate-bounce">
                        {getRankingIcon(entry.position)}
                      </div>
                      <Badge 
                        className={`text-sm px-3 py-1 font-bold shadow-md ${
                          entry.position === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0' :
                          entry.position === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0' :
                          entry.position === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0' :
                          'bg-gradient-to-r from-purple-400 to-blue-500 text-white border-0'
                        }`}
                      >
                        #{entry.position}
                      </Badge>
                    </div>

                    {/* Enhanced User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                            {entry.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          {entry.position <= 3 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                              <Medal className="w-3 h-3 text-yellow-800" />
                            </div>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-slate-900 truncate">{entry.username}</span>
                            {userIsCurrentUser && (
                              <Badge className="bg-blue-500 text-white text-xs px-2 py-1 animate-pulse">
                                🎮 VOCÊ
                              </Badge>
                            )}
                          </div>
                          
                          {/* Simplified Points Display */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm font-semibold">
                              ⭐ {entry.invite_points} pontos
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Prize Display */}
                      {entry.prize_amount > 0 && (
                        <div className="mt-3 text-center">
                          {getPrizeDisplay(entry.prize_amount, entry.position)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Desktop Table - Simplified for gamification */}
        <div className="hidden lg:block mt-8">
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Posição</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-center">Pontos</TableHead>
                      <TableHead className="text-center">Prêmio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rankings.map((entry: MonthlyRankingEntry) => {
                      const userIsCurrentUser = isCurrentUser(entry.user_id);
                      return (
                        <TableRow 
                          key={entry.user_id}
                          className={`${userIsCurrentUser ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md" : ""} hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-2xl">{getRankingIcon(entry.position)}</div>
                              <Badge 
                                className={`font-bold ${
                                  entry.position === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0' :
                                  entry.position === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0' :
                                  entry.position === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0' :
                                  'bg-gradient-to-r from-purple-400 to-blue-500 text-white border-0'
                                }`}
                              >
                                #{entry.position}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                                  {entry.username?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                {entry.position <= 3 && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <Medal className="w-2.5 h-2.5 text-yellow-800" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-lg text-slate-900">
                                  {entry.username}
                                  {userIsCurrentUser && (
                                    <Badge className="ml-2 bg-blue-500 text-white text-xs animate-pulse">
                                      🎮 VOCÊ
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-lg font-bold px-4 py-2">
                              ⭐ {entry.invite_points}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.prize_amount > 0 ? (
                              getPrizeDisplay(entry.prize_amount, entry.position)
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRankingPage;