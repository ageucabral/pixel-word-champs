import React from 'react';
import { Coins, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStats } from '@/hooks/useUserStats';
import { useProfile } from '@/hooks/useProfile';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { useWeeklyCompetitionAutoParticipation } from '@/hooks/useWeeklyCompetitionAutoParticipation';
import { useWeeklyRankingUpdater } from '@/hooks/useWeeklyRankingUpdater';
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
const HomeScreen = ({
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

  // Usar sistema real de níveis e títulos baseado nos experience_points
  const totalXP = profile?.experience_points || 0;
  const {
    currentLevel,
    progress
  } = usePlayerLevel(totalXP);

  // Função para calcular prêmio baseado na posição real
  const calculatePrizeForPosition = (position: number) => {
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
  };

  // Handlers para interações com as stats
  const handleViewTotalScore = () => {
    setActiveTab('ranking');
  };

  const handleViewRanking = () => {
    onViewFullRanking();
  };
  
  logger.info('🏠 HomeScreen renderizado', {
    userId: user?.id,
    competitionsCount: competitions.length,
    timestamp: new Date().toISOString()
  }, 'HOME_SCREEN');
  
  if (isLoading || statsLoading || profileLoading) {
    return <LoadingState />;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header compacto roxo com informações do usuário */}
        <div className="bg-gradient-to-br from-primary to-primary-darker rounded-2xl p-4 text-white shadow-lg ring-1 ring-white/10">
          {/* Topo do header com avatar, nome e nível */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <UserAvatar 
                src={profile?.avatar_url}
                alt={`Avatar de ${user?.username || 'Usuário'}`}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-white truncate">
                  {user?.username || 'Usuário'}
                </h2>
                <div className="flex items-center space-x-2 mt-0.5">
                  <p className="text-white/80 text-xs font-medium">
                    Nv. {currentLevel.level}
                  </p>
                  <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    {currentLevel.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Estatísticas em linha única */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="w-4 h-4 text-accent" />
                <span className="text-xs text-white/90 font-medium">Pontos Totais</span>
                <span className="text-lg font-bold text-white">
                  {statsLoading ? '...' : (stats?.totalScore || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-accent" />
                <span className="text-xs text-white/90 font-medium">Ranking</span>
                <span className="text-lg font-bold text-white">
                  {statsLoading ? '...' : (stats?.position ? `#${stats.position}` : 'N/A')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Ranking Global aprimorado */}
        <div className="bg-card rounded-2xl p-4 shadow-lg border border-border transition-all duration-200 hover:shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-darker rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
              #{stats?.position || 'N/A'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Posição atual</p>
                  <p className="text-lg font-bold text-foreground truncate">
                    {stats?.position ? `${stats.position}º lugar mundial` : 'Posição não disponível'}
                  </p>
                </div>
                
                {/* Informação de Premiação compacta */}
                {stats?.position && !prizesLoading && (
                  <div className="text-right flex-shrink-0 ml-2">
                    {(() => {
                      const position = stats.position;
                      const prizeInfo = calculatePrizeForPosition(position);
                      return (
                        <div 
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            prizeInfo.amount > 0 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                          title={prizeInfo.amount > 0 ? `Premiação: ${prizeInfo.text}` : 'Sem premiação nesta posição'}
                        >
                          {prizeInfo.amount > 0 ? `🎁 ${prizeInfo.text}` : '💰 Sem premiação'}
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
                    ? `${Math.max(100, Math.ceil((stats.totalScore || 0) * 0.1)).toLocaleString()} pts para subir no ranking` 
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
};
export default HomeScreen;