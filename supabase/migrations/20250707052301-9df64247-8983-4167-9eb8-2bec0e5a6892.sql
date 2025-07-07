-- Correção do Sistema de Finalização Automática - Cron Job e Competição Expirada
-- Prioridade: Crítica - Sistema não está funcionando automaticamente

-- 1. CORRIGIR HORÁRIO DO CRON JOB
-- Cancelar cron job com horário incorreto
SELECT cron.unschedule('weekly-competition-finalizer');

-- Recriar cron job com horário correto: 03:01 UTC = 00:01 Brasília
SELECT cron.schedule(
  'weekly-competition-finalizer',
  '1 3 * * *', -- 03:01 UTC = 00:01 Brasília (horário correto)
  $$
  SELECT
    net.http_post(
      url := 'https://oqzpkqbmcnpxpegshlcm.supabase.co/functions/v1/weekly-competition-finalizer',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xenBrcWJtY25weHBlZ3NobGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE0NjkzNywiZXhwIjoyMDY0NzIyOTM3fQ.H8vx1BVlYa9gJVGl7eP7m6H-0HLxDLKKR_7L0NtKWZk"}'::jsonb,
      body := jsonb_build_object(
        'manual_trigger', false,
        'scheduled_execution', true,
        'execution_time', now()
      )
    ) as request_id;
  $$
);

-- 2. CORRIGIR COMPETIÇÃO EXPIRADA ATUAL
-- Atualizar status de competições expiradas
UPDATE weekly_config 
SET 
  status = 'completed',
  completed_at = NOW()
WHERE status = 'active' 
  AND end_date < CURRENT_DATE;

-- 3. EXECUTAR FINALIZAÇÃO MANUAL DA COMPETIÇÃO ATUAL
-- Chamar função de finalização para corrigir situação atual
SELECT finalize_weekly_competition();

-- 4. CRIAR FUNÇÃO DE MONITORAMENTO
CREATE OR REPLACE FUNCTION public.monitor_cron_executions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cron_status jsonb;
  expired_competitions integer;
  active_competitions integer;
  health_status text := 'healthy';
BEGIN
  -- Verificar competições expiradas não finalizadas
  SELECT COUNT(*) INTO expired_competitions
  FROM weekly_config 
  WHERE status = 'active' AND end_date < CURRENT_DATE;
  
  -- Verificar competições ativas
  SELECT COUNT(*) INTO active_competitions
  FROM weekly_config 
  WHERE status = 'active';
  
  -- Determinar status da saúde do sistema
  IF expired_competitions > 0 THEN
    health_status := 'critical';
  ELSIF active_competitions = 0 THEN
    health_status := 'warning';
  END IF;
  
  -- Registrar check de saúde
  INSERT INTO system_health_checks (
    check_type,
    status,
    details
  ) VALUES (
    'weekly_competition_automation',
    health_status,
    jsonb_build_object(
      'expired_competitions', expired_competitions,
      'active_competitions', active_competitions,
      'cron_job_configured', EXISTS(
        SELECT 1 FROM cron.job WHERE jobname = 'weekly-competition-finalizer'
      ),
      'checked_at', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'status', health_status,
    'expired_competitions', expired_competitions,  
    'active_competitions', active_competitions,
    'cron_configured', EXISTS(
      SELECT 1 FROM cron.job WHERE jobname = 'weekly-competition-finalizer'
    ),
    'timestamp', NOW()
  );
END;
$$;

-- 5. CRIAR FUNÇÃO DE TESTE MANUAL DO CRON JOB
CREATE OR REPLACE FUNCTION public.test_weekly_finalizer()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Executar chamada manual para a edge function
  SELECT
    net.http_post(
      url := 'https://oqzpkqbmcnpxpegshlcm.supabase.co/functions/v1/weekly-competition-finalizer',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xenBrcWJtY25weHBlZ3NobGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE0NjkzNywiZXhwIjoyMDY0NzIyOTM3fQ.H8vx1BVlYa9gJVGl7eP7m6H-0HLxDLKKR_7L0NtKWZk"}'::jsonb,
      body := jsonb_build_object(
        'manual_trigger', true,
        'test_execution', true,
        'execution_time', now()
      )
    ) INTO result;
  
  RETURN jsonb_build_object(
    'success', true,
    'manual_test_executed', true,
    'result', result,
    'timestamp', NOW()
  );
END;
$$;

-- 6. LOG DA CORREÇÃO
INSERT INTO automation_logs (
  automation_type,
  scheduled_time,
  executed_at,
  execution_status,
  affected_users,
  settings_snapshot
) VALUES (
  'weekly_finalizer_cron_correction',
  NOW(),
  NOW(),
  'completed',
  0,
  jsonb_build_object(
    'problem', 'Cron job configurado para horário incorreto e não executando',
    'old_schedule', '5 0 * * * (00:05 UTC = 21:05 Brasília)',
    'new_schedule', '1 3 * * * (03:01 UTC = 00:01 Brasília)',
    'actions_taken', jsonb_build_array(
      'Cancelou cron job antigo',
      'Criou cron job com horário correto',
      'Finalizou competição expirada manualmente',
      'Criou funções de monitoramento',
      'Adicionou função de teste manual'
    ),
    'next_execution', '2025-07-08 03:01:00 UTC',
    'monitoring_enabled', true,
    'corrected_at', NOW()
  )
);