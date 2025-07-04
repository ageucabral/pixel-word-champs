import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Award, Crown, Zap, Sparkles, ArrowLeft, Play, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const formatTimeRemaining = () => {
    // Mock time remaining - in real app would calculate based on competition end date
    return "2d 14h 32m";
  };

  const getTotalParticipants = () => {
    return ranking.length.toLocaleString();
  };

  const getTotalPrizePool = () => {
    const total = prizeConfigs.reduce((sum, config) => sum + config.prize_amount, 0);
    return `R$ ${total.toLocaleString()}`;
  };

  const getTop3Players = () => {
    return ranking.slice(0, 3);
  };

  const getCurrentUser = () => {
    return ranking.find(p => p.user_id === user?.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
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
    );
  }

  const top3Players = getTop3Players();
  const currentUser = getCurrentUser();

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 min-h-screen">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button className="text-white p-2">
            <ArrowLeft className="text-lg" />
          </button>
          <h1 className="text-white font-bold text-lg">Ranking</h1>
          <button className="text-white p-2">
            <Trophy className="text-lg text-yellow-400" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Competition Info */}
        <section className="mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="text-center mb-4">
              <h2 className="text-white font-bold text-xl mb-2">Caça Palavras Royale</h2>
              <div className="flex items-center justify-center space-x-2 text-yellow-400">
                <Crown className="text-lg" />
                <span className="font-semibold">Competição Semanal</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center bg-black/20 rounded-xl p-3">
              <div className="text-center">
                <div className="text-white/70 text-xs">Tempo Restante</div>
                <div className="text-white font-bold">{formatTimeRemaining()}</div>
              </div>
              <div className="text-center">
                <div className="text-white/70 text-xs">Participantes</div>
                <div className="text-white font-bold">{getTotalParticipants()}</div>
              </div>
              <div className="text-center">
                <div className="text-white/70 text-xs">Premio Total</div>
                <div className="text-yellow-400 font-bold">{getTotalPrizePool()}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Prize Podium */}
        <section className="mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <h3 className="text-white font-bold text-lg mb-4 text-center">Top 3 Premiados</h3>
            
            <div className="flex items-end justify-center space-x-2 mb-4">
              {/* Second Place */}
              {top3Players[1] && (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-gray-400 overflow-hidden mb-2 mx-auto bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {top3Players[1].name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded-full mb-1">2°</div>
                  <div className="text-white text-sm font-semibold">{top3Players[1].name}</div>
                  <div className="text-yellow-400 text-xs font-bold">R$ {getPrizeAmount(2)}</div>
                  <div className="bg-gray-600 h-16 w-12 rounded-t-lg mt-2 mx-auto"></div>
                </div>
              )}
              
              {/* First Place */}
              {top3Players[0] && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-yellow-400 overflow-hidden mb-2 mx-auto relative bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {top3Players[0].name?.charAt(0)?.toUpperCase() || 'U'}
                    <div className="absolute -top-2 -right-1">
                      <Crown className="text-yellow-400 text-lg" />
                    </div>
                  </div>
                  <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full mb-1">1°</div>
                  <div className="text-white text-sm font-semibold">{top3Players[0].name}</div>
                  <div className="text-yellow-400 text-xs font-bold">R$ {getPrizeAmount(1)}</div>
                  <div className="bg-yellow-500 h-20 w-12 rounded-t-lg mt-2 mx-auto"></div>
                </div>
              )}
              
              {/* Third Place */}
              {top3Players[2] && (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-orange-600 overflow-hidden mb-2 mx-auto bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {top3Players[2].name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full mb-1">3°</div>
                  <div className="text-white text-sm font-semibold">{top3Players[2].name}</div>
                  <div className="text-yellow-400 text-xs font-bold">R$ {getPrizeAmount(3)}</div>
                  <div className="bg-orange-700 h-12 w-12 rounded-t-lg mt-2 mx-auto"></div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Ranking List */}
        <section className="mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
            <div className="bg-black/20 px-4 py-3 border-b border-white/10">
              <h3 className="text-white font-bold text-lg">Classificação Geral</h3>
            </div>
            
            {/* User Position (if not in top visible) */}
            {currentUser && currentUser.pos > 5 && (
              <div className="bg-blue-600/20 border-b border-white/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {currentUser.pos}
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-blue-600 overflow-hidden bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="text-white font-semibold">Você</div>
                      <div className="text-white/70 text-sm">{currentUser.score.toLocaleString()} pts</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getPrizeAmount(currentUser.pos) > 0 && (
                      <>
                        <div className="text-yellow-400 font-bold text-sm">R$ {getPrizeAmount(currentUser.pos)}</div>
                        <div className="text-white/70 text-xs">Premio</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto">
              {ranking.slice(0, 20).map((player) => {
                const isCurrentUser = user?.id === player.user_id;
                const prizeAmount = getPrizeAmount(player.pos);
                
                return (
                  <div key={player.user_id} className={`border-b border-white/10 px-4 py-3 ${isCurrentUser ? 'bg-blue-600/20' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ${
                          player.pos === 1 ? 'bg-yellow-400 text-black' :
                          player.pos === 2 ? 'bg-gray-400 text-white' :
                          player.pos === 3 ? 'bg-orange-600 text-white' :
                          'bg-white/20 text-white'
                        }`}>
                          {player.pos}
                        </div>
                        <div className={`w-10 h-10 rounded-full border-2 overflow-hidden bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold ${
                          player.pos === 1 ? 'border-yellow-400' :
                          player.pos === 2 ? 'border-gray-400' :
                          player.pos === 3 ? 'border-orange-600' :
                          'border-white/30'
                        }`}>
                          {player.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-white font-semibold">
                            {isCurrentUser ? 'Você' : player.name}
                          </div>
                          <div className="text-white/70 text-sm">{player.score.toLocaleString()} pts</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {prizeAmount > 0 && (
                          <div className="text-yellow-400 font-bold">R$ {prizeAmount}</div>
                        )}
                        {player.pos === 1 && <Crown className="text-yellow-400 text-sm" />}
                        {player.pos === 2 && <Medal className="text-gray-400 text-sm" />}
                        {player.pos === 3 && <Medal className="text-orange-600 text-sm" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="space-y-3 mb-20">
          <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg">
            <Play className="inline mr-2" />
            Continuar Jogando
          </button>
          
          <button className="w-full bg-white/10 backdrop-blur-lg border border-white/20 text-white font-semibold py-3 rounded-2xl">
            <Share className="inline mr-2" />
            Compartilhar Ranking
          </button>
        </section>
      </main>
    </div>
  );
};
export default RankingScreen;