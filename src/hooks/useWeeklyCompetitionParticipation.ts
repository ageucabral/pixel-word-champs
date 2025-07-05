
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface ParticipationData {
  id: string;
  competition_id: string;
  user_id: string;
  user_score: number;
  user_position: number | null;
  created_at: string;
}

export const useWeeklyCompetitionParticipation = (competitionId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [participation, setParticipation] = useState<ParticipationData | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (competitionId && user?.id) {
      checkParticipation();
    }
  }, [competitionId, user?.id]);

  const checkParticipation = async () => {
    if (!competitionId || !user?.id) return;

    try {
      logger.debug('🔍 Verificando participação na competição:', { competitionId }, 'USE_WEEKLY_COMPETITION_PARTICIPATION');

      const { data, error } = await supabase
        .from('competition_participations')
        .select('*')
        .eq('competition_id', competitionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('❌ Erro ao verificar participação:', { error }, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
        throw error;
      }

      if (data) {
        logger.debug('✅ Usuário já participando:', data, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
        setParticipation(data);
        setIsParticipating(true);
      } else {
        logger.debug('ℹ️ Usuário não está participando ainda', {}, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
        setIsParticipating(false);
      }

    } catch (error) {
      logger.error('❌ Erro ao verificar participação:', { error }, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
    } finally {
      setIsLoading(false);
    }
  };

  const joinCompetition = async () => {
    if (!competitionId || !user?.id || isParticipating) return;

    try {
      logger.info('🎯 Inscrevendo usuário na competição (PARTICIPAÇÃO LIVRE):', { competitionId }, 'USE_WEEKLY_COMPETITION_PARTICIPATION');

      // Participação livre - sem verificação de limites
      const { data, error } = await supabase
        .from('competition_participations')
        .insert({
          competition_id: competitionId,
          user_id: user.id,
          user_score: 0
        })
        .select()
        .single();

      if (error) {
        logger.error('❌ Erro ao inscrever na competição:', { error }, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
        throw error;
      }

      logger.info('✅ Inscrição realizada com sucesso (PARTICIPAÇÃO LIVRE):', data, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
      setParticipation(data);
      setIsParticipating(true);

      toast({
        title: "Inscrição realizada!",
        description: "Você foi inscrito na competição semanal com sucesso. Participação é livre para todos!",
      });

      return data;

    } catch (error) {
      logger.error('❌ Erro ao inscrever na competição:', { error }, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
      toast({
        title: "Erro na inscrição",
        description: "Não foi possível inscrever na competição. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateScore = async (newScore: number) => {
    if (!participation || !user?.id) return;

    try {
      logger.debug('📊 Atualizando pontuação:', { newScore }, 'USE_WEEKLY_COMPETITION_PARTICIPATION');

      const { data, error } = await supabase
        .from('competition_participations')
        .update({ user_score: newScore })
        .eq('id', participation.id)
        .select()
        .single();

      if (error) {
        logger.error('❌ Erro ao atualizar pontuação:', { error }, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
        throw error;
      }

      logger.debug('✅ Pontuação atualizada:', data, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
      setParticipation(data);

      return data;

    } catch (error) {
      logger.error('❌ Erro ao atualizar pontuação:', { error }, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
      throw error;
    }
  };

  // Monitorar mudanças em tempo real na participação
  useEffect(() => {
    if (!competitionId || !user?.id) return;

    const channel = supabase
      .channel(`participation-${competitionId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competition_participations',
          filter: `competition_id=eq.${competitionId} AND user_id=eq.${user.id}`
        },
        (payload) => {
          logger.debug('📡 Mudança na participação detectada:', payload, 'USE_WEEKLY_COMPETITION_PARTICIPATION');
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setParticipation(payload.new as ParticipationData);
            setIsParticipating(true);
          } else if (payload.eventType === 'DELETE') {
            setParticipation(null);
            setIsParticipating(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitionId, user?.id]);

  return {
    participation,
    isParticipating,
    isLoading,
    joinCompetition,
    updateScore,
    refetch: checkParticipation
  };
};
