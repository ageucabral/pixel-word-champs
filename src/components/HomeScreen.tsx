import React, { memo, useCallback, useMemo } from 'react';
import { Coins, Trophy, Sparkles, Star, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { useProfile } from '@/hooks/useProfile';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { useWeeklyCompetitionAutoParticipation } from '@/hooks/useWeeklyCompetitionAutoParticipation';
import { useWeeklyRankingUpdater } from '@/hooks/useWeeklyRankingUpdater';
import { useWeeklyRanking } from '@/hooks/useWeeklyRanking';
import { useOptimizedCompetitions } from '@/hooks/useOptimizedCompetitions';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { usePrizeConfigurations } from '@/hooks/usePrizeConfigurations';
import HomeHeader from './home/HomeHeader';
import UserStatsCard from './home/UserStatsCard';
import CompetitionsList from './home/CompetitionsList';
import LoadingState from './home/LoadingState';
import ErrorState from './home/ErrorState';
import { UserCardSkeleton } from '@/components/ui/SkeletonLoader';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { StatsCard } from '@/components/ui/StatsCard';
import { logger } from '@/utils/logger';
interface HomeScreenProps {
  onStartChallenge: (challengeId: string) => void;
  onViewFullRanking: () => void;
  onViewChallengeRanking: (challengeId: number) => void;
}
const HomeScreen = memo(({
  onStartChallenge,
  onViewFullRanking
}: HomeScreenProps) => {
  const {
    user
  } = useAuth();
  const {
    stats,
    isLoading: statsLoading
  } = useUserStats();
  const {
    profile,
    isLoading: profileLoading
  } = useProfile();
  const {
    setActiveTab,
    handleNavigateToSettings
  } = useAppNavigation();

  // Usar o hook otimizado que já inclui competições ativas e agendadas
  const {
    competitions,
    isLoading,
    error,
    refetch
  } = useOptimizedCompetitions();

  // Buscar configurações de prêmios reais
  const {
    data: prizeConfigurations,
    isLoading: prizesLoading
  } = usePrizeConfigurations();

  // Manter participação automática e atualização de ranking semanal
  useWeeklyCompetitionAutoParticipation();
  useWeeklyRankingUpdater();

  // Buscar ranking semanal para calcular diferença real
  const { currentRanking } = useWeeklyRanking();

  // Usar sistema real de níveis e títulos baseado nos experience_points
  const totalXP = profile?.experience_points || 0;
  const {
    currentLevel,
    progress
  } = usePlayerLevel(totalXP);

  // Função para calcular pontos necessários para subir no ranking (memoizada)
  const calculatePointsToNextPosition = useCallback(() => {
    if (!stats?.position || !user?.id || !currentRanking.length) return 0;
    
    const currentUserPosition = stats.position;
    const currentUserScore = stats.totalScore;
    
    // Encontrar o jogador na posição imediatamente acima
    const playerAbove = currentRanking.find(player => player.position === currentUserPosition - 1);
    
    if (!playerAbove) return 0;
    
    // Calcular diferença + 1 para ultrapassar
    return Math.max(0, playerAbove.total_score - currentUserScore + 1);
  }, [stats?.position, stats?.totalScore, user?.id, currentRanking]);

  // Função para calcular prêmio baseado na posição real (memoizada)
  const calculatePrizeForPosition = useCallback((position: number) => {
    if (!prizeConfigurations) return {
      amount: 0,
      text: ''
    };

    // Buscar prêmio individual para a posição específica
    const individualPrize = prizeConfigurations.find(config => config.type === 'individual' && config.position === position);
    if (individualPrize) {
      return {
        amount: individualPrize.prize_amount,
        text: `R$ ${individualPrize.prize_amount.toFixed(2).replace('.', ',')}`
      };
    }

    // Buscar prêmio de grupo que inclua esta posição
    const groupPrize = prizeConfigurations.find(config => {
      if (config.type !== 'group' || !config.position_range) return false;
      const [start, end] = config.position_range.split('-').map(Number);
      return position >= start && position <= end;
    });
    if (groupPrize) {
      return {
        amount: groupPrize.prize_amount,
        text: `R$ ${groupPrize.prize_amount.toFixed(2).replace('.', ',')}`
      };
    }
    return {
      amount: 0,
      text: ''
    };
  }, [prizeConfigurations]);

  // Handlers para interações com as stats (memoizados)
  const handleViewTotalScore = useCallback(() => {
    setActiveTab('ranking');
  }, [setActiveTab]);

  const handleViewRanking = useCallback(() => {
    onViewFullRanking();
  }, [onViewFullRanking]);
  
  logger.info('🏠 HomeScreen renderizado', {
    userId: user?.id,
    competitionsCount: competitions.length,
    timestamp: new Date().toISOString()
  }, 'HOME_SCREEN');
  
  if (isLoading || statsLoading || profileLoading) {
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
  // Loading otimizado
  const optimizedLoadingScreen = useMemo(() => (
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
  ), []);

  if (isLoading || statsLoading || profileLoading) {
    return optimizedLoadingScreen;
  }

  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-2 sm:p-3 pb-20 safe-area-inset">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto space-y-3 sm:space-y-4">
        {/* Header compacto roxo com informações do usuário - otimizado para mobile */}
        <div className="bg-gradient-to-br from-primary to-primary-darker rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-lg ring-1 ring-white/10">
          {/* Topo do header com avatar, nome e nível */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <UserAvatar 
                src={profile?.avatar_url}
                alt={`Avatar de ${user?.username || 'Usuário'}`}
                size="md"
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {user?.username || 'Usuário'}
                </h2>
                <div className="flex items-center space-x-1.5 sm:space-x-2 mt-0.5">
                  <p className="text-white/80 text-xs font-medium">
                    Nv. {currentLevel.level}
                  </p>
                  <span className="bg-accent text-accent-foreground px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    {currentLevel.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Estatísticas em linha única - responsivo */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
                <span className="text-xs text-white/90 font-medium hidden sm:inline">Pontos Totais</span>
                <span className="text-xs text-white/90 font-medium sm:hidden">Pontos</span>
                <span className="text-sm sm:text-lg font-bold text-white">
                  {statsLoading ? '...' : (stats?.totalScore || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
                <span className="text-xs text-white/90 font-medium">Ranking</span>
                <span className="text-sm sm:text-lg font-bold text-white">
                  {statsLoading ? '...' : (stats?.position ? `#${stats.position}` : 'N/A')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Ranking Global aprimorado - responsivo */}
        <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-border transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary-darker rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm sm:text-lg shadow-sm flex-shrink-0">
              #{stats?.position || 'N/A'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Posição atual</p>
                  <p className="text-sm sm:text-lg font-bold text-foreground truncate">
                    {stats?.position ? `${stats.position}º lugar mundial` : 'Posição não disponível'}
                  </p>
                </div>
                
                {/* Informação de Premiação compacta - responsivo */}
                {stats?.position && !prizesLoading && (
                  <div className="text-right flex-shrink-0 ml-1 sm:ml-2">
                    {(() => {
                      const position = stats.position;
                      const prizeInfo = calculatePrizeForPosition(position);
                      return (
                        <div 
                          className={`px-1.5 sm:px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            prizeInfo.amount > 0 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                          title={prizeInfo.amount > 0 ? `Premiação: ${prizeInfo.text}` : 'Sem premiação nesta posição'}
                        >
                          <span className="hidden sm:inline">{prizeInfo.amount > 0 ? `🎁 ${prizeInfo.text}` : '💰 Sem premiação'}</span>
                          <span className="sm:hidden">{prizeInfo.amount > 0 ? '🎁' : '💰'}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              {/* Barra de progresso aprimorada */}
              <div className="space-y-1">
                <div className="bg-secondary rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary-darker rounded-full h-2 transition-all duration-500 ease-out" 
                    style={{ width: '65%' }}
                    role="progressbar"
                    aria-valuenow={65}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progresso no ranking"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.position && stats.position > 1 
                    ? `${calculatePointsToNextPosition().toLocaleString()} pts para subir no ranking` 
                    : 'Você está no topo!'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && <ErrorState error={error} onRetry={refetch} />}

        <CompetitionsList competitions={competitions} onStartChallenge={onStartChallenge} onRefresh={refetch} />
      </div>
    </div>;
});

HomeScreen.displayName = 'HomeScreen';

export default HomeScreen;