import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Users, Gift, Crown, Medal, Award, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface RankingPlayer {
  pos: number;
  user_id: string;
  name: string;
  score: number;
  avatar_url?: string;
}

interface PrizeConfig {
  position: number;
  prize_amount: number;
}

interface CompetitionData {
  id: string;
  title: string;
  end_date: string;
  total_participants: number;
  total_prize_pool: number;
  status: string;
}

const RankingScreen = () => {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [prizeConfigs, setPrizeConfigs] = useState<PrizeConfig[]>([]);
  const [competition, setCompetition] = useState<CompetitionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrizeConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('prize_configurations')
        .select('position, prize_amount')
        .eq('type', 'individual')
        .eq('active', true)
        .in('position', [1, 2, 3])
        .order('position', { ascending: true });

      if (error) throw error;

      const prizes: PrizeConfig[] = (data || []).map(config => ({
        position: config.position!,
        prize_amount: Number(config.prize_amount) || 0
      }));
      
      setPrizeConfigs(prizes);
    } catch (err) {
      // Define prêmios padrão em caso de erro
      setPrizeConfigs([
        { position: 1, prize_amount: 500 },
        { position: 2, prize_amount: 200 },
        { position: 3, prize_amount: 100 }
      ]);
    }
  };

  const loadActiveCompetition = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_config')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error) {
        // Se não há competição ativa, buscar a última competição
        const { data: lastCompetition } = await supabase
          .from('weekly_config')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (lastCompetition) {
          setCompetition({
            id: lastCompetition.id,
            title: 'Competição Semanal',
            end_date: lastCompetition.end_date,
            total_participants: 0,
            total_prize_pool: 0,
            status: lastCompetition.status
          });
        }
        return;
      }

      if (data) {
        // Calcular total de prêmios e participantes
        const { data: prizeData } = await supabase
          .from('prize_configurations')
          .select('prize_amount')
          .eq('active', true);
        
        const totalPrizePool = prizeData?.reduce((sum, prize) => sum + Number(prize.prize_amount), 0) || 0;
        
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('total_score', 0);

        setCompetition({
          id: data.id,
          title: 'Caça Palavras Royale',
          end_date: data.end_date,
          total_participants: count || 0,
          total_prize_pool: totalPrizePool,
          status: data.status
        });
      }
    } catch (err) {
      console.error('Erro ao carregar competição:', err);
    }
  };

  const loadRanking = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, total_score, avatar_url')
        .gt('total_score', 0)
        .order('total_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      const players: RankingPlayer[] = (data || []).map((profile, index) => ({
        pos: index + 1,
        user_id: profile.id,
        name: profile.username || 'Usuário',
        score: profile.total_score || 0,
        avatar_url: profile.avatar_url
      }));

      setRanking(players);

      // Encontrar posição do usuário atual
      if (user?.id) {
        const userRank = players.find(p => p.user_id === user.id);
        setUserPosition(userRank?.pos || null);
      }
    } catch (err) {
      setError('Erro ao carregar ranking');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([loadPrizeConfigurations(), loadActiveCompetition(), loadRanking()]);
  }, [user?.id]);

  // Configurar atualizações em tempo real
  useEffect(() => {
    const profilesChannel = supabase.channel('profiles-ranking-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        loadRanking();
      }).subscribe();

    const interval = setInterval(() => {
      loadRanking();
    }, 30000);

    return () => {
      supabase.removeChannel(profilesChannel);
      clearInterval(interval);
    };
  }, [user?.id]);

  const getPrizeAmount = (position: number) => {
    const prizeConfig = prizeConfigs.find(config => config.position === position);
    return prizeConfig?.prize_amount || 0;
  };

  const getTimeRemaining = () => {
    if (!competition?.end_date) {
      console.log('🔍 [RankingScreen] No end_date found');
      return 'Finalizada';
    }
    
    console.log('🔍 [RankingScreen] Competition data:', {
      end_date: competition.end_date,
      end_date_type: typeof competition.end_date,
      end_date_length: competition.end_date.length,
      status: competition.status
    });
    
    const now = new Date();
    const endDate = new Date(competition.end_date);
    
    console.log('🔍 [RankingScreen] Initial dates:', {
      now: now.toISOString(),
      endDate_before: endDate.toISOString(),
      now_time: now.getTime(),
      endDate_time: endDate.getTime()
    });
    
    // Detectar se é apenas data (sem horário) usando regex mais robusta
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(competition.end_date.trim());
    
    if (isDateOnly) {
      // Definir como final do dia no horário de Brasília
      endDate.setHours(23, 59, 59, 999);
      console.log('🔍 [RankingScreen] Date-only detected, set to end of day:', {
        endDate_after: endDate.toISOString(),
        endDate_time_after: endDate.getTime()
      });
    }
    
    const timeDiff = endDate.getTime() - now.getTime();
    
    console.log('🔍 [RankingScreen] Time calculation:', {
      timeDiff,
      timeDiff_hours: timeDiff / (1000 * 60 * 60),
      is_past: timeDiff <= 0
    });
    
    if (timeDiff <= 0) {
      console.log('🔍 [RankingScreen] Competition marked as finished');
      return 'Finalizada';
    }
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log('🔍 [RankingScreen] Time remaining calculated:', {
      hours,
      minutes,
      display: hours > 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h ${minutes}m` : `${hours}h ${minutes}m`
    });
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h ${minutes}m`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const getPlayerAvatar = (player: RankingPlayer, size: 'small' | 'medium' = 'medium') => {
    const firstLetter = player.name?.charAt(0).toUpperCase() || 'U';
    const sizeClasses = size === 'small' ? 'w-10 h-10' : 'w-12 h-12';
    
    if (player.avatar_url) {
      return (
        <img 
          src={player.avatar_url} 
          alt={player.name}
          className={`${sizeClasses} rounded-full object-cover border-2 border-white/30`}
        />
      );
    }
    
    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold`}>
        {firstLetter}
      </div>
    );
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="text-white text-xs" />;
      case 2:
        return <Medal className="text-white text-xs" />;
      case 3:
        return <Award className="text-white text-xs" />;
      default:
        return null;
    }
  };

  const getRankBorderColor = (position: number) => {
    switch (position) {
      case 1:
        return 'border-l-4 border-yellow-500';
      case 2:
        return 'border-l-4 border-gray-400';
      case 3:
        return 'border-l-4 border-orange-500';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 font-medium">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  const currentUser = ranking.find(p => p.user_id === user?.id);
  const topThree = ranking.slice(0, 3);
  const remainingPlayers = ranking.slice(3, 10);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative">
        <div className="flex items-center justify-between p-4">
          <button className="p-2">
            <ArrowLeft className="text-xl" />
          </button>
          <h1 className="text-lg font-bold">Ranking</h1>
          <button className="p-2">
            <Trophy className="text-xl text-yellow-300" />
          </button>
        </div>
        
        {/* Competition Info */}
        <div className="px-4 pb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <h2 className="text-xl font-bold mb-2">{competition?.title || 'Caça Palavras Royale'}</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="text-yellow-300" size={16} />
                <span className="text-sm">Termina em {getTimeRemaining()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="text-green-300" size={16} />
                <span className="text-sm">{competition?.total_participants || ranking.length} jogadores</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Prize Pool */}
      <section className="px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <h3 className="text-center font-bold text-gray-800 mb-3">
            <Gift className="inline mr-2 text-purple-600" size={20} />
            Prêmios da Competição
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(position => {
              const prizeAmount = getPrizeAmount(position);
              const configs = [
                { icon: Crown, bg: 'from-yellow-400 to-yellow-600', label: '1°' },
                { icon: Medal, bg: 'from-gray-300 to-gray-500', label: '2°' },
                { icon: Award, bg: 'from-orange-400 to-orange-600', label: '3°' }
              ];
              const config = configs[position - 1];
              
              return (
                <div key={position} className="text-center">
                  <div className={`bg-gradient-to-b ${config.bg} rounded-lg p-3 ${position === 1 ? 'shadow-lg shadow-yellow-400/50' : ''}`}>
                    <config.icon className="text-white text-xl mb-1 mx-auto" />
                    <div className="text-white text-xs font-bold">{config.label}</div>
                    <div className="text-white text-sm font-bold">R$ {prizeAmount}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Your Position */}
      {currentUser && (
        <section className="px-4 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg">Sua Posição</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-3xl font-bold">#{currentUser.pos}</span>
                  <div className="text-sm opacity-90">
                    <div>{currentUser.score.toLocaleString()} pontos</div>
                    {getPrizeAmount(currentUser.pos) > 0 && (
                      <div>Prêmio: R$ {getPrizeAmount(currentUser.pos)}</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {getPlayerAvatar(currentUser)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Top Players */}
      <section className="px-4 mb-20">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top Jogadores</h3>
        
        {/* Top 3 */}
        {topThree.map((player) => (
          <div 
            key={player.user_id} 
            className={`bg-white rounded-xl shadow-md p-4 mb-3 ${getRankBorderColor(player.pos)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {getPlayerAvatar(player)}
                  {player.pos <= 3 && (
                    <div className={`absolute -top-1 -right-1 rounded-full w-6 h-6 flex items-center justify-center ${
                      player.pos === 1 ? 'bg-yellow-500' : 
                      player.pos === 2 ? 'bg-gray-500' : 'bg-orange-500'
                    }`}>
                      {getRankIcon(player.pos)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{player.name}</h4>
                  <p className="text-sm text-gray-600">{player.score.toLocaleString()} pontos</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${
                  player.pos === 1 ? 'text-yellow-600' : 
                  player.pos === 2 ? 'text-gray-600' : 'text-orange-600'
                }`}>
                  #{player.pos}
                </span>
                {getPrizeAmount(player.pos) > 0 && (
                  <div className="text-xs text-green-600 font-medium">
                    R$ {getPrizeAmount(player.pos)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Ranks 4+ */}
        {remainingPlayers.map((player) => (
          <div key={player.user_id} className="bg-white rounded-xl shadow-md p-3 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getPlayerAvatar(player, 'small')}
                <div>
                  <h4 className="font-semibold text-gray-800">{player.name}</h4>
                  <p className="text-sm text-gray-600">{player.score.toLocaleString()} pontos</p>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-700">#{player.pos}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default RankingScreen;