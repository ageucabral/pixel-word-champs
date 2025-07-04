import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Users, Gift, Crown, Medal, Award, ArrowLeft, ArrowUp, ArrowDown, Sparkles, Star, Zap } from 'lucide-react';
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
  const {
    user
  } = useAuth();
  const [ranking, setRanking] = useState<RankingPlayer[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [prizeConfigs, setPrizeConfigs] = useState<PrizeConfig[]>([]);
  const [competition, setCompetition] = useState<CompetitionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allPlayers, setAllPlayers] = useState<RankingPlayer[]>([]);
  const itemsPerPage = 20;
  const loadPrizeConfigurations = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('prize_configurations').select('position, prize_amount').eq('type', 'individual').eq('active', true).in('position', [1, 2, 3]).order('position', {
        ascending: true
      });
      if (error) throw error;
      const prizes: PrizeConfig[] = (data || []).map(config => ({
        position: config.position!,
        prize_amount: Number(config.prize_amount) || 0
      }));
      setPrizeConfigs(prizes);
    } catch (err) {
      // Define prêmios padrão em caso de erro
      setPrizeConfigs([{
        position: 1,
        prize_amount: 500
      }, {
        position: 2,
        prize_amount: 200
      }, {
        position: 3,
        prize_amount: 100
      }]);
    }
  };
  const loadActiveCompetition = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('weekly_config').select('*').eq('status', 'active').single();
      if (error) {
        // Se não há competição ativa, buscar a última competição
        const {
          data: lastCompetition
        } = await supabase.from('weekly_config').select('*').order('created_at', {
          ascending: false
        }).limit(1).single();
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
        const {
          data: prizeData
        } = await supabase.from('prize_configurations').select('prize_amount').eq('active', true);
        const totalPrizePool = prizeData?.reduce((sum, prize) => sum + Number(prize.prize_amount), 0) || 0;
        const {
          count
        } = await supabase.from('profiles').select('*', {
          count: 'exact',
          head: true
        }).gt('total_score', 0);
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
  const loadRanking = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      // Primeiro, buscar o total de jogadores para calcular as páginas
      const {
        count
      } = await supabase.from('profiles').select('*', {
        count: 'exact',
        head: true
      }).gt('total_score', 0);
      const totalCount = count || 0;
      const calculatedTotalPages = Math.ceil(totalCount / itemsPerPage);
      setTotalPages(calculatedTotalPages);

      // Calcular o offset para a página atual
      const offset = (page - 1) * itemsPerPage;

      // Buscar dados da página atual
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, username, total_score, avatar_url').gt('total_score', 0).order('total_score', {
        ascending: false
      }).range(offset, offset + itemsPerPage - 1);
      if (error) throw error;
      const players: RankingPlayer[] = (data || []).map((profile, index) => ({
        pos: offset + index + 1,
        user_id: profile.id,
        name: profile.username || 'Usuário',
        score: profile.total_score || 0,
        avatar_url: profile.avatar_url
      }));
      setRanking(players);

      // Para encontrar a posição do usuário, precisamos fazer uma busca separada
      if (user?.id) {
        const {
          data: allUsersData
        } = await supabase.from('profiles').select('id').gt('total_score', 0).order('total_score', {
          ascending: false
        });
        if (allUsersData) {
          const userIndex = allUsersData.findIndex(p => p.id === user.id);
          setUserPosition(userIndex >= 0 ? userIndex + 1 : null);
        }
      }
    } catch (err) {
      setError('Erro ao carregar ranking');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    Promise.all([loadPrizeConfigurations(), loadActiveCompetition(), loadRanking(currentPage)]);
  }, [user?.id, currentPage]);

  // Configurar atualizações em tempo real
  useEffect(() => {
    const profilesChannel = supabase.channel('profiles-ranking-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles'
    }, () => {
      loadRanking(currentPage);
    }).subscribe();
    const interval = setInterval(() => {
      loadRanking(currentPage);
    }, 30000);
    return () => {
      supabase.removeChannel(profilesChannel);
      clearInterval(interval);
    };
  }, [user?.id, currentPage]);
  const getPrizeAmount = (position: number) => {
    const prizeConfig = prizeConfigs.find(config => config.position === position);
    return prizeConfig?.prize_amount || 0;
  };
  const getTimeRemaining = () => {
    if (!competition?.end_date) return 'Finalizada';
    const now = new Date();

    // Detectar se é apenas data (YYYY-MM-DD) e concatenar horário final do dia
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(competition.end_date.trim());
    const endDateString = isDateOnly ? competition.end_date + 'T23:59:59' : competition.end_date;
    const endDate = new Date(endDateString);
    const timeDiff = endDate.getTime() - now.getTime();
    if (timeDiff <= 0) return 'Finalizada';
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor(timeDiff % (1000 * 60 * 60) / (1000 * 60));
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
      return <img src={player.avatar_url} alt={player.name} className={`${sizeClasses} rounded-full object-cover border-2 border-white/30`} />;
    }
    return <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold`}>
        {firstLetter}
      </div>;
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
            Carregando ranking...
          </p>
        </div>
      </div>;
  }
  const currentUser = ranking.find(p => p.user_id === user?.id);

  // Para a primeira página, separar top 3 e o resto
  let topThree: RankingPlayer[] = [];
  let remainingPlayers: RankingPlayer[] = [];
  if (currentPage === 1) {
    topThree = ranking.slice(0, 3);
    remainingPlayers = ranking.slice(3);
  } else {
    // Para outras páginas, mostrar todos os jogadores normalmente
    remainingPlayers = ranking;
  }
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-lg">
          
          {/* Competition Info */}
          <div className="p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4">
              
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Clock className="text-yellow-300" size={16} />
                  <span className="text-xs">Termina em {getTimeRemaining()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="text-green-300" size={16} />
                  <span className="text-xs">{competition?.total_participants || ranking.length} jogadores</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Prize Pool */}
        <div className="bg-card rounded-2xl shadow-lg p-4 border border-border">
          <h3 className="text-center font-bold text-foreground mb-3 text-sm">
            <Gift className="inline mr-2 text-primary" size={18} />
            Prêmios da Competição
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(position => {
            const prizeAmount = getPrizeAmount(position);
            const configs = [{
              icon: Crown,
              bg: 'from-yellow-400 to-yellow-600',
              label: '1°'
            }, {
              icon: Medal,
              bg: 'from-gray-300 to-gray-500',
              label: '2°'
            }, {
              icon: Award,
              bg: 'from-orange-400 to-orange-600',
              label: '3°'
            }];
            const config = configs[position - 1];
            return <div key={position} className="text-center">
                  <div className={`bg-gradient-to-b ${config.bg} rounded-lg p-2 ${position === 1 ? 'shadow-lg shadow-yellow-400/50' : ''}`}>
                    <config.icon className="text-white text-lg mb-1 mx-auto" />
                    <div className="text-white text-xs font-bold">{config.label}</div>
                    <div className="text-white text-xs font-bold">R$ {prizeAmount}</div>
                  </div>
                </div>;
          })}
          </div>
        </div>

        {/* Your Position */}
        {currentUser && <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-base">Sua Posição</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl font-bold">#{currentUser.pos}</span>
                  <div className="text-xs opacity-90">
                    <div>{currentUser.score.toLocaleString()} pontos</div>
                    {getPrizeAmount(currentUser.pos) > 0 && <div>Prêmio: R$ {getPrizeAmount(currentUser.pos)}</div>}
                  </div>
                </div>
              </div>
              <div className="text-right ml-2">
                {getPlayerAvatar(currentUser)}
              </div>
            </div>
          </div>}

        {/* Top Players */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-foreground mb-3">Top Jogadores</h3>
          
          {/* Top 3 */}
          {topThree.map(player => <div key={player.user_id} className={`bg-card rounded-2xl shadow-md p-3 border border-border ${getRankBorderColor(player.pos)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    {getPlayerAvatar(player)}
                    {player.pos <= 3 && <div className={`absolute -top-1 -right-1 rounded-full w-6 h-6 flex items-center justify-center ${player.pos === 1 ? 'bg-yellow-500' : player.pos === 2 ? 'bg-gray-500' : 'bg-orange-500'}`}>
                        {getRankIcon(player.pos)}
                      </div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-foreground text-sm truncate">{player.name}</h4>
                    <p className="text-xs text-muted-foreground">{player.score.toLocaleString()} pontos</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className={`text-xl font-bold ${player.pos === 1 ? 'text-yellow-600' : player.pos === 2 ? 'text-gray-600' : 'text-orange-600'}`}>
                    #{player.pos}
                  </span>
                  {getPrizeAmount(player.pos) > 0 && <div className="text-xs text-green-600 font-medium">
                      R$ {getPrizeAmount(player.pos)}
                    </div>}
                </div>
              </div>
            </div>)}

          {/* Ranks 4+ */}
          {remainingPlayers.map(player => <div key={player.user_id} className="bg-card rounded-2xl shadow-md p-3 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getPlayerAvatar(player, 'small')}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground text-sm truncate">{player.name}</h4>
                    <p className="text-xs text-muted-foreground">{player.score.toLocaleString()} pontos</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-muted-foreground flex-shrink-0 ml-2">#{player.pos}</span>
              </div>
            </div>)}
          
          {/* Paginação */}
          {totalPages > 1 && <div className="flex items-center justify-center space-x-1 mt-4">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-2 rounded-lg bg-card shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted border border-border">
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({
              length: Math.min(3, totalPages)
            }, (_, i) => {
              let pageNum;
              if (totalPages <= 3) {
                pageNum = i + 1;
              } else if (currentPage <= 2) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 1) {
                pageNum = totalPages - 2 + i;
              } else {
                pageNum = currentPage - 1 + i;
              }
              return <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`px-2 py-2 rounded-lg shadow-md text-sm border ${currentPage === pageNum ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground hover:bg-muted border-border'}`}>
                      {pageNum}
                    </button>;
            })}
              </div>
              
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-2 rounded-lg bg-card shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted border border-border">
                <ArrowUp className="w-4 h-4 rotate-90" />
              </button>
            </div>}
          
          {/* Informações da página */}
          <div className="text-center text-xs text-muted-foreground mt-2">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      </div>
    </div>;
};
export default RankingScreen;