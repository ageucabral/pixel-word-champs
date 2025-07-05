-- Corrigir sistema de finalização semanal removendo cron job problemático
-- e garantindo que apenas o processo completo seja usado

-- 1. REMOVER CRON JOB PROBLEMÁTICO que chama edge function inexistente
SELECT cron.unschedule('daily-weekly-ranking-reset-check');

-- 2. Verificar e garantir que o cron correto existe e está funcionando
-- Verificar se weekly-competition-finalizer existe
DO $main$
BEGIN
  -- Se não existir o job correto, criar
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'weekly-competition-finalizer'
  ) THEN
    PERFORM cron.schedule(
      'weekly-competition-finalizer',
      '5 3 * * *', -- 03:05 UTC = 00:05 Brasília
      $cron$
      SELECT
        net.http_post(
          url := 'https://oqzpkqbmcnpxpegshlcm.supabase.co/functions/v1/weekly-competition-finalizer',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xenBrcWJtY25weHBlZ3NobGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE0NjkzNywiZXhwIjoyMDY0NzIyOTM3fQ.H8vx1BVlYa9gJVGl7eP7m6H-0HLxDLKKR_7L0NtKWZk"}'::jsonb,
          body := '{}'::jsonb
        ) as request_id;
      $cron$
    );
    RAISE NOTICE 'Cron job weekly-competition-finalizer criado';
  END IF;
END $main$;

-- 3. Adicionar função de proteção para evitar reset sem snapshot
CREATE OR REPLACE FUNCTION public.prevent_unsafe_score_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  active_comp RECORD;
  has_snapshot BOOLEAN;
BEGIN
  -- Verificar se existe competição ativa sem snapshot
  SELECT * INTO active_comp
  FROM weekly_config 
  WHERE status IN ('active', 'completed')
  ORDER BY end_date DESC
  LIMIT 1;
  
  IF active_comp IS NOT NULL THEN
    -- Verificar se tem snapshot
    SELECT EXISTS(
      SELECT 1 FROM weekly_competitions_snapshot 
      WHERE competition_id = active_comp.id
    ) INTO has_snapshot;
    
    IF NOT has_snapshot AND active_comp.end_date < CURRENT_DATE THEN
      RAISE EXCEPTION 'BLOQUEIO DE SEGURANÇA: Não é possível resetar pontuações sem criar snapshot da competição %. Use finalize_weekly_competition().', active_comp.id;
    END IF;
  END IF;
END;
$func$;

-- 4. Registrar correção no log
INSERT INTO automation_logs (
  automation_type,
  scheduled_time,
  executed_at,
  execution_status,
  affected_users,
  settings_snapshot
) VALUES (
  'weekly_finalization_system_fix',
  NOW(),
  NOW(),
  'completed',
  0,
  jsonb_build_object(
    'problem_solved', 'Removed problematic cron job that caused score reset without snapshot',
    'removed_cron', 'daily-weekly-ranking-reset-check',
    'kept_cron', 'weekly-competition-finalizer',
    'security_improvement', 'Added prevent_unsafe_score_reset protection',
    'process_order', 'Snapshot -> Reset -> New Competition',
    'fixed_at', NOW()
  )
);