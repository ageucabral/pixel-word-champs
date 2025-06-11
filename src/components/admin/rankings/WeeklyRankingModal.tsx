
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, Medal, Crown } from 'lucide-react';
import PlayerAvatar from '@/components/ui/PlayerAvatar';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface RankingParticipant {
  user_position: number;
  user_score: number;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url?: string;
  } | null;
}

interface CompetitionInfo {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  theme?: string;
  max_participants: number;
  prize_pool: number;
  total_participants: number;
}

interface WeeklyRankingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
}

const ITEMS_PER_PAGE = 25;

export const WeeklyRankingModal: React.FC<WeeklyRankingModalProps> = ({
  open,
  onOpenChange,
  competitionId
}) => {
  const { toast } = useToast();
  
  const [ranking, setRanking] = useState<RankingParticipant[]>([]);
  const [competition, setCompetition] = useState<CompetitionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (open && competitionId) {
      loadCompetitionData();
    }
  }, [open, competitionId]);

  const loadCompetitionData = async () => {
    if (!competitionId) return;

    setIsLoading(true);
    try {
      console.log('🔄 Carregando dados da competição:', competitionId);

      // Carregar informações da competição
      const { data: competitionData, error: competitionError } = await supabase
        .from('custom_competitions')
        .select('*')
        .eq('id', competitionId)
        .single();

      if (competitionError) {
        console.error('❌ Erro ao carregar competição:', competitionError);
        throw competitionError;
      }

      console.log('✅ Competição carregada:', competitionData);

      // Contar total de participantes
      const { count: totalParticipants } = await supabase
        .from('competition_participations')
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', competitionId);

      const competitionInfo: CompetitionInfo = {
        id: competitionData.id,
        title: competitionData.title,
        description: competitionData.description || '',
        start_date: competitionData.start_date,
        end_date: competitionData.end_date,
        status: competitionData.status,
        theme: competitionData.theme,
        max_participants: competitionData.max_participants || 0,
        prize_pool: Number(competitionData.prize_pool) || 0,
        total_participants: totalParticipants || 0
      };

      setCompetition(competitionInfo);

      // Carregar participações da competição ordenadas por pontuação (maior para menor)
      const { data: participationsData, error: participationsError } = await supabase
        .from('competition_participations')
        .select('user_id, user_score, user_position, created_at')
        .eq('competition_id', competitionId)
        .order('user_score', { ascending: false });

      if (participationsError) {
        console.error('❌ Erro ao carregar participações:', participationsError);
        throw participationsError;
      }

      // Buscar informações dos perfis dos usuários
      const userIds = participationsData?.map(p => p.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('❌ Erro ao carregar perfis:', profilesError);
        throw profilesError;
      }

      // Combinar dados de participação com perfis
      const rankingParticipants: RankingParticipant[] = (participationsData || []).map((participation, index) => {
        const profile = profilesData?.find(p => p.id === participation.user_id);
        
        return {
          user_position: index + 1,
          user_score: participation.user_score || 0,
          user_id: participation.user_id || '',
          created_at: participation.created_at || '',
          profiles: profile ? {
            username: profile.username || 'Usuário',
            avatar_url: profile.avatar_url
          } : null
        };
      });

      console.log('📊 Ranking carregado:', rankingParticipants.length, 'participantes');
      setRanking(rankingParticipants);

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da competição.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string, isEndDate: boolean = false) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const timeFormatted = isEndDate ? '23:59:59' : '00:00:00';
    
    return `${dateFormatted}, ${timeFormatted}`;
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <Trophy className="h-4 w-4 text-slate-400" />;
    }
  };

  const getPositionBadgeColor = (position: number) => {
    switch (position) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-gray-100 text-gray-700 border-gray-200';
      case 3: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPrizeAmount = (position: number) => {
    if (!competition) return 0;
    
    const prizePool = competition.prize_pool;
    
    switch (position) {
      case 1: return prizePool * 0.50;
      case 2: return prizePool * 0.30;
      case 3: return prizePool * 0.20;
      default: return 0;
    }
  };

  // Paginação
  const totalPages = Math.ceil(ranking.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRanking = ranking.slice(startIndex, endIndex);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            Ranking da Competição Semanal
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-purple-600 rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando ranking...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Competition Info */}
            {competition && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-purple-600" />
                        {competition.title}
                      </CardTitle>
                      <p className="text-slate-600 mt-1">{competition.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        competition.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                        competition.status === 'completed' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      }>
                        {competition.status === 'active' ? 'Ativo' : 
                         competition.status === 'completed' ? 'Finalizado' : 'Agendado'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>Início: {formatDateTime(competition.start_date, false)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>Fim: {formatDateTime(competition.end_date, true)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="h-4 w-4" />
                      <span>Participantes: {competition.total_participants}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Trophy className="h-4 w-4" />
                      <span>Prêmio: R$ {competition.prize_pool.toFixed(2)}</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Ranking Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  Ranking ({ranking.length} participantes)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ranking.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="font-medium mb-2">Nenhum participante ainda</p>
                    <p className="text-sm">Os participantes aparecerão aqui conforme participarem do torneio.</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Posição</TableHead>
                          <TableHead>Jogador</TableHead>
                          <TableHead className="text-right w-24">Pontuação</TableHead>
                          <TableHead className="text-right w-32">Prêmio</TableHead>
                          <TableHead className="text-right w-32">Participação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRanking.map((participant) => (
                          <TableRow key={participant.user_id} className="hover:bg-slate-50">
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <Badge className={getPositionBadgeColor(participant.user_position)}>
                                  <div className="flex items-center gap-1">
                                    {getPositionIcon(participant.user_position)}
                                    {participant.user_position}º
                                  </div>
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <PlayerAvatar
                                  src={participant.profiles?.avatar_url}
                                  alt={participant.profiles?.username || 'Usuário'}
                                  fallback={participant.profiles?.username?.charAt(0) || 'U'}
                                  size="sm"
                                />
                                <span className="font-medium">
                                  {participant.profiles?.username || 'Usuário'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {participant.user_score.toLocaleString()} pts
                            </TableCell>
                            <TableCell className="text-right">
                              {getPrizeAmount(participant.user_position) > 0 ? (
                                <span className="font-semibold text-green-600">
                                  R$ {getPrizeAmount(participant.user_position).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm text-slate-500">
                              {new Date(participant.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const page = i + 1;
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(page)}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            })}
                            
                            {totalPages > 5 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
