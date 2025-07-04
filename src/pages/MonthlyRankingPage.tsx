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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
      case 'not_eligible':
        return <Badge variant="outline">Sem prêmio</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
        <div className="space-y-3">
          {data.rankings.map((entry: MonthlyRankingEntry) => {
            const userIsCurrentUser = isCurrentUser(entry.user_id);
            return (
              <Card 
                key={entry.user_id}
                className={`border-2 transition-all duration-200 ${getRankingColor(entry.position, userIsCurrentUser)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Position and Icon */}
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div className="text-2xl mb-1">{getRankingIcon(entry.position)}</div>
                      <Badge 
                        className={`text-xs px-2 py-1 ${
                          entry.position === 1 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          entry.position === 2 ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          entry.position === 3 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {entry.position}º
                      </Badge>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {entry.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 truncate">{entry.username}</span>
                            {userIsCurrentUser && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                Você
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                        <span>{entry.invite_points} pontos</span>
                        <span>{entry.invites_count} convites</span>
                        <span>{entry.active_invites_count} ativos</span>
                      </div>

                      {/* Prize and Status */}
                      <div className="flex items-center justify-between">
                        <div>
                          {entry.prize_amount > 0 ? (
                            <div className="text-sm font-bold text-green-600">
                              R$ {entry.prize_amount.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Sem prêmio</span>
                          )}
                        </div>
                        <div>
                          {getPaymentStatusBadge(entry.payment_status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Desktop Table - Hidden on mobile, shown on larger screens */}
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
                      <TableHead className="text-center">Convites</TableHead>
                      <TableHead className="text-center">Prêmio</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rankings.map((entry: MonthlyRankingEntry) => {
                      const userIsCurrentUser = isCurrentUser(entry.user_id);
                      return (
                        <TableRow 
                          key={entry.user_id}
                          className={userIsCurrentUser ? "bg-blue-50 border-blue-200" : ""}
                        >
                          <TableCell>
                            {getPositionBadge(entry.position)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {entry.username?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">
                                  {entry.username}
                                  {userIsCurrentUser && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Você
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {entry.active_invites_count} ativos de {entry.invites_count} convites
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-bold text-slate-800">
                              {entry.invite_points}
                            </div>
                            <div className="text-xs text-slate-500">pontos</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-medium text-slate-700">
                              {entry.invites_count}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.prize_amount > 0 ? (
                              <div className="font-bold text-green-600">
                                R$ {entry.prize_amount.toFixed(2)}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {getPaymentStatusBadge(entry.payment_status)}
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