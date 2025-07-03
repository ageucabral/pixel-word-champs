import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Award, Crown, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
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
const RankingScreen = () => {
  const {
    user
  } = useAuth();
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [prizeConfigs, setPrizeConfigs] = useState<PrizeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadPrizeConfigurations = async () => {
    try {
      logger.debug('Carregando configurações de prêmios', undefined, 'RANKING_SCREEN');
      const {
        data,
        error
      } = await supabase.from('prize_configurations').select('position, prize_amount').eq('type', 'individual').eq('active', true).in('position', [1, 2, 3]).order('position', {
        ascending: true
      });
      if (error) {
        logger.error('Erro ao carregar prêmios', {
          error
        }, 'RANKING_SCREEN');
        throw error;
      }
      const prizes: PrizeConfig[] = (data || []).map(config => ({
        position: config.position!,
        prize_amount: Number(config.prize_amount) || 0
      }));
      setPrizeConfigs(prizes);
      logger.info('Prêmios carregados com sucesso', {
        prizesCount: prizes.length
      }, 'RANKING_SCREEN');
    } catch (err) {
      logger.error('Erro ao carregar configurações de prêmios', {
        error: err
      }, 'RANKING_SCREEN');
      // Define prêmios padrão em caso de erro
      setPrizeConfigs([{
        position: 1,
        prize_amount: 100
      }, {
        position: 2,
        prize_amount: 50
      }, {
        position: 3,
        prize_amount: 25
      }]);
    }
  };
  const loadRanking = async () => {
    try {
      setIsLoading(true);
      setError(null);
      logger.debug('Carregando ranking', undefined, 'RANKING_SCREEN');
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, username, total_score').gt('total_score', 0).order('total_score', {
        ascending: false
      }).limit(50);
      if (error) {
        logger.error('Erro ao carregar ranking', {
          error
        }, 'RANKING_SCREEN');
        throw error;
      }
      const players: RankingPlayer[] = (data || []).map((profile, index) => ({
        pos: index + 1,
        user_id: profile.id,
        name: profile.username || 'Usuário',
        score: profile.total_score || 0
      }));
      setRanking(players);

      // Encontrar posição do usuário atual
      if (user?.id) {
        const userRank = players.find(p => p.user_id === user.id);
        setUserPosition(userRank?.pos || null);
        if (userRank) {
          logger.info('Posição do usuário encontrada', {
            position: userRank.pos,
            score: userRank.score
          }, 'RANKING_SCREEN');
        }
      }
      logger.info('Ranking carregado com sucesso', {
        playersCount: players.length
      }, 'RANKING_SCREEN');
    } catch (err) {
      logger.error('Erro ao carregar ranking', {
        error: err
      }, 'RANKING_SCREEN');
      setError('Erro ao carregar ranking');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    Promise.all([loadPrizeConfigurations(), loadRanking()]);
  }, [user?.id]);

  // Configurar atualizações em tempo real
  useEffect(() => {
    logger.debug('Configurando monitoramento em tempo real', undefined, 'RANKING_SCREEN');
    const profilesChannel = supabase.channel('profiles-ranking-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles'
    }, payload => {
      logger.debug('Mudança detectada nos perfis', {
        payload
      }, 'RANKING_SCREEN');
      loadRanking();
    }).subscribe();

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      logger.debug('Atualização periódica do ranking', undefined, 'RANKING_SCREEN');
      loadRanking();
    }, 30000);
    return () => {
      logger.debug('Desconectando canais de tempo real', undefined, 'RANKING_SCREEN');
      supabase.removeChannel(profilesChannel);
      clearInterval(interval);
    };
  }, [user?.id]);
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
          {position}
        </div>;
    }
  };
  const getPrizeAmount = (position: number) => {
    const prizeConfig = prizeConfigs.find(config => config.position === position);
    return prizeConfig?.prize_amount || 0;
  };
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
        
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
            Carregando ranking épico...
          </p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-3">
        {/* Header compacto */}
        

        {/* Premiação compacta */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-fade-in">
          <CardContent className="p-3">
            <div className="text-center mb-2">
              <h3 className="text-sm font-bold text-slate-800 mb-1">🏆 Premiação</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(position => {
              const prizeAmount = getPrizeAmount(position);
              const icons = [{
                icon: Crown,
                bg: 'from-yellow-400 to-yellow-500',
                medal: '🥇'
              }, {
                icon: Medal,
                bg: 'from-gray-400 to-gray-500',
                medal: '🥈'
              }, {
                icon: Award,
                bg: 'from-orange-400 to-orange-500',
                medal: '🥉'
              }];
              const iconData = icons[position - 1];
              return <div key={position} className="text-center">
                    <div className={`w-8 h-8 bg-gradient-to-r ${iconData.bg} rounded-full flex items-center justify-center mx-auto mb-1 shadow-md`}>
                      <iconData.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-lg mb-1">{iconData.medal}</div>
                    <div className="text-sm font-bold text-green-600">
                      R$ {prizeAmount.toFixed(0)}
                    </div>
                    <div className="text-xs text-slate-600">
                      {position}º lugar
                    </div>
                  </div>;
            })}
            </div>
          </CardContent>
        </Card>

        {/* User Position Card compacto */}
        {userPosition && user && <Card className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 border-0 shadow-lg animate-fade-in">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <div className="text-lg font-bold">#{userPosition}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sua Posição</p>
                    <p className="text-lg font-bold">
                      {ranking.find(p => p.user_id === user.id)?.score.toLocaleString() || 0} pts
                    </p>
                  </div>
                </div>
                {getPrizeAmount(userPosition) > 0 && <div className="text-right">
                    <div className="text-xs text-white/80">💰 Prêmio</div>
                    <div className="text-lg font-bold">R$ {getPrizeAmount(userPosition).toFixed(0)}</div>
                  </div>}
              </div>
            </CardContent>
          </Card>}

        {/* Error State */}
        {error && <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm animate-fade-in">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-red-700 font-medium mb-3">{error}</p>
              <Button onClick={loadRanking} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 bg-white/50 backdrop-blur-sm">
                🔄 Tentar novamente
              </Button>
            </CardContent>
          </Card>}

        {/* Ranking List compacto */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg animate-fade-in">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              Classificação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ranking.length === 0 ? <div className="text-center py-8 text-slate-500">
                <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold mb-1">Arena Vazia!</p>
                <p className="text-xs">Seja o primeiro campeão! 🎯</p>
              </div> : <div className="space-y-0">
                {ranking.map((player, index) => {
              const isCurrentUser = user?.id === player.user_id;
              const prizeAmount = getPrizeAmount(player.pos);
              return <div key={player.user_id} className={`flex items-center justify-between p-3 transition-all hover:bg-slate-50 ${isCurrentUser ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-2 border-purple-500' : ''} ${player.pos <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {player.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        
                        <div>
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                            <span>{isCurrentUser ? 'Você' : player.name}</span>
                            {player.pos === 1 && <span className="text-xs">👑</span>}
                            {player.pos === 2 && <span className="text-xs">🥈</span>}
                            {player.pos === 3 && <span className="text-xs">🥉</span>}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            {player.score.toLocaleString()} pontos
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-sm text-purple-700">
                          #{player.pos}
                        </div>
                        {prizeAmount > 0 && <div className="text-xs text-green-600 font-semibold">
                            R$ {prizeAmount.toFixed(0)}
                          </div>}
                      </div>
                    </div>;
            })}
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default RankingScreen;