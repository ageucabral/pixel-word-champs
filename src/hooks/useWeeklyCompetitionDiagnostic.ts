
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWeeklyCompetitionActivation } from './useWeeklyCompetitionActivation';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface DiagnosticResult {
  hasActiveCompetition: boolean;
  hasScheduledCompetitions: boolean;
  scheduledCompetitions: any[];
  usersWithScores: number;
  currentRankingEntries: number;
  systemStatus: 'healthy' | 'needs_attention' | 'error';
  issues: string[];
}

export const useWeeklyCompetitionDiagnostic = () => {
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { activateWeeklyCompetitions, isActivating } = useWeeklyCompetitionActivation();

  const runDiagnostic = async () => {
    setIsChecking(true);
    try {
      logger.info('🔍 Executando diagnóstico de competições semanais', {
        timestamp: getCurrentBrasiliaTime()
      }, 'USE_WEEKLY_COMPETITION_DIAGNOSTIC');

      // Verificar competições ativas
      const { data: activeConfigs } = await supabase
        .from('weekly_config')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Verificar competições agendadas
      const { data: scheduledConfigs } = await supabase
        .from('weekly_config')
        .select('*')
        .eq('status', 'scheduled')
        .order('start_date', { ascending: true });

      // Contar usuários com pontuação
      const { count: usersWithScores } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .gt('total_score', 0);

      // Contar entradas no ranking atual
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      
      const { count: rankingEntries } = await supabase
        .from('weekly_rankings')
        .select('id', { count: 'exact' })
        .gte('week_start', currentWeekStart.toISOString().split('T')[0]);

      // Analisar status do sistema
      const hasActive = (activeConfigs?.length || 0) > 0;
      const hasScheduled = (scheduledConfigs?.length || 0) > 0;
      const issues: string[] = [];

      if (!hasActive && !hasScheduled) {
        issues.push('Nenhuma competição configurada');
      }

      if (hasScheduled && !hasActive) {
        issues.push('Competições agendadas não foram ativadas automaticamente');
      }

      if ((usersWithScores || 0) > 0 && (rankingEntries || 0) === 0) {
        issues.push('Usuários com pontuação mas sem rankings gerados');
      }

      const systemStatus: DiagnosticResult['systemStatus'] = 
        issues.length === 0 ? 'healthy' : 
        issues.length <= 2 ? 'needs_attention' : 'error';

      const result: DiagnosticResult = {
        hasActiveCompetition: hasActive,
        hasScheduledCompetitions: hasScheduled,
        scheduledCompetitions: scheduledConfigs || [],
        usersWithScores: usersWithScores || 0,
        currentRankingEntries: rankingEntries || 0,
        systemStatus,
        issues
      };

      setDiagnostic(result);
      logger.info('✅ Diagnóstico concluído:', result, 'USE_WEEKLY_COMPETITION_DIAGNOSTIC');
      
    } catch (error) {
      logger.error('❌ Erro no diagnóstico:', { error }, 'USE_WEEKLY_COMPETITION_DIAGNOSTIC');
      setDiagnostic({
        hasActiveCompetition: false,
        hasScheduledCompetitions: false,
        scheduledCompetitions: [],
        usersWithScores: 0,
        currentRankingEntries: 0,
        systemStatus: 'error',
        issues: ['Erro ao executar diagnóstico']
      });
    } finally {
      setIsChecking(false);
    }
  };

  const forceActivation = async () => {
    logger.info('🚀 Forçando ativação de competições semanais', {
      timestamp: getCurrentBrasiliaTime()
    }, 'USE_WEEKLY_COMPETITION_DIAGNOSTIC');

    const result = await activateWeeklyCompetitions();
    
    if (result.success) {
      logger.info('✅ Ativação forçada bem-sucedida', {}, 'USE_WEEKLY_COMPETITION_DIAGNOSTIC');
      // Re-executar diagnóstico após ativação
      await runDiagnostic();
    }
    
    return result;
  };

  return {
    diagnostic,
    isChecking,
    isActivating,
    runDiagnostic,
    forceActivation
  };
};
