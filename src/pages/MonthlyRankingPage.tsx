import React from 'react';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              <h1 className="text-2xl font-bold text-slate-900">Carregando ranking...</h1>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.rankings?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              <h1 className="text-2xl font-bold text-slate-900">Ranking de Indicações - {currentMonth}</h1>
            </div>
          </div>
          
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Nenhum participante ainda</h3>
                <p className="text-sm text-slate-500 max-w-md">
                  Seja o primeiro a fazer indicações e aparecer no ranking mensal!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900">Ranking de Indicações - {currentMonth}</h1>
            <Badge variant="outline" className="ml-auto">
              {data.rankings.length} participantes
            </Badge>
          </div>
        </div>

        {/* Ranking Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
        </div>
      </div>
    </div>
  );
};

export default MonthlyRankingPage;