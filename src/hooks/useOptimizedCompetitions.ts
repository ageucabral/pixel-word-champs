
import { useState, useEffect, useMemo } from 'react';
import { Competition } from '@/types';
import { competitionService } from '@/services/competitionService';
import { customCompetitionService } from '@/services/customCompetitionService';
import { logger, structuredLog } from '@/utils/logger';

export const useOptimizedCompetitions = () => {
  const [allCompetitions, setAllCompetitions] = useState<Competition[]>([]);
  const [customCompetitions, setCustomCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Retornar todas as competições (ativas E agendadas) para a lista principal
  const competitions = useMemo(() => {
    return allCompetitions.filter(comp => 
      comp.status === 'active' || comp.status === 'scheduled'
    );
  }, [allCompetitions]);

  // Manter filtro específico para competições ativas apenas
  const activeCompetitions = useMemo(() => {
    return allCompetitions.filter(comp => comp.status === 'active');
  }, [allCompetitions]);

  const dailyCompetition = useMemo(() => {
    return customCompetitions.find(comp => 
      comp.competition_type === 'challenge' && 
      comp.status === 'active'
    ) || null;
  }, [customCompetitions]);

  const weeklyCompetition = useMemo(() => {
    return customCompetitions.find(comp => 
      comp.competition_type === 'tournament' && 
      comp.status === 'active'
    ) || null;
  }, [customCompetitions]);

  const loadCompetitions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Usar Promise.allSettled para não falhar se uma requisição falhar
      const [competitionsResponse, customCompetitionsResponse] = await Promise.allSettled([
        competitionService.getActiveCompetitions(),
        customCompetitionService.getCustomCompetitions()
      ]);

      // Processar resultado das competições
      if (competitionsResponse.status === 'fulfilled' && competitionsResponse.value.success) {
        setAllCompetitions(competitionsResponse.value.data || []);
      } else {
        logger.warn('Falha ao carregar competições principais', undefined, 'COMPETITIONS');
      }

      // Processar resultado das competições customizadas
      if (customCompetitionsResponse.status === 'fulfilled' && customCompetitionsResponse.value.success) {
        setCustomCompetitions(customCompetitionsResponse.value.data || []);
      } else {
        logger.warn('Falha ao carregar competições customizadas', undefined, 'COMPETITIONS');
      }

      // Só falhar se ambas falharam
      if (competitionsResponse.status === 'rejected' && customCompetitionsResponse.status === 'rejected') {
        throw new Error('Falha ao carregar todas as competições');
      }

      logger.debug('Competições carregadas com sucesso - incluindo agendadas e ativas');
    } catch (err) {
      const errorMessage = 'Erro ao carregar competições';
      setError(errorMessage);
      structuredLog('error', errorMessage, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompetitions();
    
    // Otimizar intervalo para produção - aumentar para 5 minutos
    const interval = import.meta.env.PROD ? 300000 : 120000;
    const intervalId = setInterval(loadCompetitions, interval);
    
    return () => clearInterval(intervalId);
  }, []);

  return {
    competitions, // Agora inclui ativas E agendadas
    customCompetitions,
    activeCompetitions, // Apenas ativas (para casos específicos)
    dailyCompetition,
    weeklyCompetition,
    isLoading,
    error,
    refetch: loadCompetitions
  };
};
