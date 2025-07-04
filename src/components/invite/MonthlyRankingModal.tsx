import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users } from 'lucide-react';
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

interface MonthlyRankingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

const MonthlyRankingModal = ({ open, onOpenChange }: MonthlyRankingModalProps) => {
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Carregando ranking...
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data?.rankings?.length) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Ranking de Indicações - {currentMonth}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
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
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking de Indicações - {currentMonth}
            <Badge variant="outline" className="ml-auto">
              {data.rankings.length} participantes
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
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
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyRankingModal;