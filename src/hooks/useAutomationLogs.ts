
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface AutomationLog {
  id: string;
  automation_type: string;
  execution_status: string;
  scheduled_time: string;
  executed_at?: string;
  error_message?: string;
  settings_snapshot: any;
  affected_users: number;
  created_at: string;
}

export const useAutomationLogs = (page: number = 1, pageSize: number = 10) => {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * pageSize;

      const { data, error: logsError, count } = await supabase
        .from('automation_logs')
        .select('*', { count: 'exact' })
        .in('automation_type', [
          'weekly_competition_finalization',
          'manual_weekly_reset',
          'score_reset'
        ])
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (logsError) throw logsError;

      // Processar settings_snapshot se for string
      const processedLogs = (data || []).map(log => ({
        ...log,
        settings_snapshot: typeof log.settings_snapshot === 'string' 
          ? JSON.parse(log.settings_snapshot) 
          : log.settings_snapshot || {}
      }));

      setLogs(processedLogs);
      setTotalPages(Math.ceil((count || 0) / pageSize));

    } catch (err) {
      setError('Erro ao carregar logs de automação');
      logger.error('Erro ao buscar logs:', { err }, 'USE_AUTOMATION_LOGS');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  return {
    logs,
    isLoading,
    error,
    totalPages,
    refetch: fetchLogs
  };
};
