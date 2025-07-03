import React, { memo, useState, useCallback, useMemo } from 'react';
import { Trophy, Star, Medal, Award, Crown, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { cacheManager, createOptimizedDebounce, performanceMonitor } from '@/utils/performanceOptimizer';
import { useOptimizedRankingData } from '@/hooks/useOptimizedRankingData';

interface RankingPlayer {
  pos: number;
  user_id: string;
  name: string;
  score: number;
}

interface PrizeConfig {
  position: number;
  prize_amount: number;
}

// Componente memoizado para ícone de posição
const PositionIcon = memo(({ position }: { position: number }) => {
  const iconElement = useMemo(() => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-orange-500" />;
      default: return (
        <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
          {position}
        </div>
      );
    }
  }, [position]);

  return iconElement;
});

PositionIcon.displayName = 'PositionIcon';

// Componente memoizado para item do ranking
const RankingItem = memo(({ 
  player, 
  isCurrentUser, 
  prizeAmount,
  index 
}: { 
  player: RankingPlayer; 
  isCurrentUser: boolean; 
  prizeAmount: number;
  index: number;
}) => {
  const itemStyle = useMemo(() => ({
    animationDelay: `${index * 50}ms`
  }), [index]);

  const avatarLetter = useMemo(() => 
    player.name?.charAt(0).toUpperCase() || 'U', 
    [player.name]
  );

  return (
    <div 
      className={`flex items-center justify-between p-4 transition-all hover:bg-slate-50 ${
        isCurrentUser ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500' : ''
      } ${player.pos <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}
      style={itemStyle}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12">
          <PositionIcon position={player.pos} />
        </div>
        
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {avatarLetter}
        </div>
        
        <div>
          <p className="font-bold text-slate-900 flex items-center gap-2">
            <span>{isCurrentUser ? 'Você' : player.name}</span>
            {player.pos === 1 && <span>👑</span>}
            {player.pos === 2 && <span>🥈</span>}
            {player.pos === 3 && <span>🥉</span>}
          </p>
          <p className="text-sm text-slate-500 font-medium">
            {player.score.toLocaleString()} pontos
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-bold text-lg text-purple-700">
          #{player.pos}
        </div>
        {prizeAmount > 0 && (
          <div className="text-xs text-green-600 font-semibold bg-green-100 rounded-full px-2 py-1 mt-1">
            R$ {prizeAmount.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
});

RankingItem.displayName = 'RankingItem';

// Loading state memoizado
const MemoizedLoadingState = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
    
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
        Carregando ranking épico...
      </p>
    </div>
  </div>
));

MemoizedLoadingState.displayName = 'MemoizedLoadingState';

const OptimizedRankingScreen = memo(() => {
  performanceMonitor.mark('ranking-screen-render-start');
  
  const { user } = useAuth();
  const {
    ranking,
    userPosition,
    prizeConfigs,
    isLoading,
    error,
    refetch
  } = useOptimizedRankingData();

  // Função memoizada para obter valor do prêmio
  const getPrizeAmount = useCallback((position: number) => {
    const cacheKey = `prize_amount_${position}`;
    const cached = cacheManager.get(cacheKey);
    if (cached !== null) return cached;

    const prizeConfig = prizeConfigs.find(config => config.position === position);
    const amount = prizeConfig?.prize_amount || 0;
    
    cacheManager.set(cacheKey, amount, 60000); // Cache por 1 minuto
    return amount;
  }, [prizeConfigs]);

  // Debounced refresh para evitar múltiplas chamadas
  const debouncedRefetch = useMemo(
    () => createOptimizedDebounce(refetch, 1000),
    [refetch]
  );

  // Memoizar lista de ranking renderizada
  const rankingList = useMemo(() => {
    performanceMonitor.mark('ranking-list-render');
    
    const list = ranking.map((player, index) => {
      const isCurrentUser = user?.id === player.user_id;
      const prizeAmount = getPrizeAmount(player.pos);
      
      return (
        <RankingItem
          key={player.user_id}
          player={player}
          isCurrentUser={isCurrentUser}
          prizeAmount={prizeAmount}
          index={index}
        />
      );
    });
    
    performanceMonitor.measure('ranking-list-time', 'ranking-list-render');
    return list;
  }, [ranking, user?.id, getPrizeAmount]);

  // User position card memoizado
  const userPositionCard = useMemo(() => {
    if (!userPosition || !user) return null;

    const userPlayerData = ranking.find(p => p.user_id === user.id);
    const prizeAmount = getPrizeAmount(userPosition);

    return (
      <Card className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 border-0 shadow-xl animate-fade-in">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <PositionIcon position={userPosition} />
              </div>
              <div>
                <p className="font-bold text-lg">#{userPosition}</p>
                <p className="text-white/80 text-sm">Sua Posição</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {userPlayerData?.score.toLocaleString() || 0}
              </p>
              <p className="text-white/80 text-sm">pontos</p>
              {prizeAmount > 0 && (
                <div className="text-sm font-semibold bg-white/20 rounded-full px-3 py-1 mt-2 backdrop-blur-sm">
                  💰 R$ {prizeAmount.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [userPosition, user, ranking, getPrizeAmount]);

  performanceMonitor.measure('ranking-screen-render-time', 'ranking-screen-render-start');

  if (isLoading) {
    return <MemoizedLoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header com mesmo estilo do HomeScreen */}
        <div className="text-center mb-8 relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              <Star className="w-4 h-4 text-yellow-400 animate-bounce" />
              <Sparkles className="w-4 h-4 text-pink-400 animate-bounce delay-100" />
              <Star className="w-4 h-4 text-blue-400 animate-bounce delay-200" />
            </div>
          </div>
          
          <div className="relative mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-2xl animate-pulse">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-ping delay-300"></div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            <h1 className="text-3xl font-black tracking-wide mb-2">
              🏆 Ranking Geral
            </h1>
          </div>
          <p className="text-slate-600 text-base font-medium">
            🌟 Classificação por pontuação total
          </p>
        </div>

        {/* Premiação dos 3 primeiros colocados */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
          <CardContent className="p-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 mb-2">🏆 Premiação</h3>
              <p className="text-sm text-slate-600">Prêmios para os primeiros colocados</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((position) => {
                const prizeAmount = getPrizeAmount(position);
                const icons = [
                  { icon: Crown, color: 'text-yellow-500', bg: 'from-yellow-400 to-yellow-500', medal: '🥇' },
                  { icon: Medal, color: 'text-gray-400', bg: 'from-gray-400 to-gray-500', medal: '🥈' },
                  { icon: Award, color: 'text-orange-500', bg: 'from-orange-400 to-orange-500', medal: '🥉' }
                ];
                const iconData = icons[position - 1];
                
                return (
                  <div key={position} className="text-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${iconData.bg} rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                      <iconData.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl mb-1">{iconData.medal}</div>
                    <div className="text-lg font-bold text-green-600">
                      R$ {prizeAmount.toFixed(0)}
                    </div>
                    <div className="text-xs text-slate-600">
                      {position}º lugar
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {userPositionCard}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm animate-fade-in">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-red-700 font-medium mb-3">{error}</p>
              <Button 
                onClick={debouncedRefetch} 
                variant="outline" 
                className="border-red-300 text-red-700 hover:bg-red-100 bg-white/50 backdrop-blur-sm"
              >
                🔄 Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ranking List com otimização */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              Classificação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ranking.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-slate-400" />
                </div>
                <p className="font-semibold text-lg mb-2">Arena Vazia!</p>
                <p className="text-sm">Seja o primeiro campeão! 🎯</p>
              </div>
            ) : (
              <div className="space-y-1">
                {rankingList}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

OptimizedRankingScreen.displayName = 'OptimizedRankingScreen';

export default OptimizedRankingScreen;