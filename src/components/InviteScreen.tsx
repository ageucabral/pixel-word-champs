
import React from 'react';
import { Trophy, Sparkles, Star, Zap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useInvites } from '@/hooks/useInvites';
import { useAuth } from '@/hooks/useAuth';
import LoadingState from './home/LoadingState';
import MonthlyInviteCompetition from './MonthlyInviteCompetition';
import { logger } from '@/utils/logger';
import InviteHeader from './invite/InviteHeader';
import UnauthenticatedView from './invite/UnauthenticatedView';
import ErrorView from './invite/ErrorView';
import MyInviteRanking from './invite/MyInviteRanking';
import MyInvitedFriends from './invite/MyInvitedFriends';
import MonthlyPrizeDisplay from './invite/MonthlyPrizeDisplay';
import CompactInviteInfo from './invite/CompactInviteInfo';
import MonthlyRankingTable from './invite/MonthlyRankingTable';
import { useMonthlyInviteCompetitionSimplified } from '@/hooks/useMonthlyInviteCompetitionSimplified';

const InviteScreen = () => {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const {
    inviteCode,
    invitedFriends,
    stats,
    isLoading,
    error
  } = useInvites();

  // Buscar dados da competição mensal
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyInviteCompetitionSimplified();

  const handleCopyCode = () => {
    if (!inviteCode) return;
    
    navigator.clipboard.writeText(inviteCode);
    logger.info('Código de convite copiado', { 
      userId: user?.id,
      inviteCode: inviteCode?.substring(0, 4) + '***'
    }, 'INVITE_SCREEN');
    
    toast({
      title: "Código copiado!",
      description: "Compartilhe com seus amigos para ambos ganharem 50XP!",
    });
  };

  if (!isAuthenticated) {
    return <UnauthenticatedView />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-16 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        
        <div className="text-center space-y-6 z-10">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full mx-auto flex items-center justify-center animate-bounce shadow-2xl">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-ping"></div>
          </div>
          
          <div className="space-y-3">
            <div className="h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full w-64 mx-auto animate-pulse opacity-80"></div>
            <div className="h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full w-48 mx-auto animate-pulse opacity-60"></div>
          </div>
          
          <div className="flex justify-center space-x-2">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
            <Star className="w-6 h-6 text-pink-400 animate-pulse" />
            <Zap className="w-6 h-6 text-blue-400 animate-bounce" />
          </div>
          
          <p className="text-purple-200 text-lg font-medium animate-pulse">
            Carregando competições épicas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    logger.error('Erro na tela de convites', { 
      error,
      userId: user?.id 
    }, 'INVITE_SCREEN');
    
    return <ErrorView error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        <InviteHeader />

        {/* Premiação do Mês - SEMPRE exibir, mesmo durante carregamento */}
        <MonthlyPrizeDisplay 
          configuredPrizes={monthlyData?.stats?.configuredPrizes || []}
        />

        {/* Minha Posição no Ranking */}
        <MyInviteRanking />

        {/* Estatísticas Compactas com Código de Convite */}
        <CompactInviteInfo 
          stats={stats}
          inviteCode={inviteCode}
          onCopyCode={handleCopyCode}
        />

        {/* Competição Mensal */}
        <div className="mb-6">
          <MonthlyInviteCompetition suppressLoading={true} />
        </div>

        {/* Ranking da Competição Mensal */}
        <MonthlyRankingTable />

        {/* Meus Amigos Indicados */}
        <MyInvitedFriends invitedFriends={invitedFriends} />
      </div>
    </div>
  );
};

export default InviteScreen;
