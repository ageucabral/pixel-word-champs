-- Ajustar timing do cron job de reset para resolver conflito com finalização
-- Mover de 00:00 UTC para 03:02 UTC (00:02 Brasília) para executar antes da finalização

-- Cancelar job existente
SELECT cron.unschedule('daily-weekly-ranking-reset-check');

-- Criar job com novo horário: 03:02 UTC (00:02 Brasília)
-- Executa 3 minutos ANTES do weekly-competition-finalizer (03:05 UTC)
SELECT cron.schedule(
  'daily-weekly-ranking-reset-check',
  '2 3 * * *', -- 03:02 UTC = 00:02 Brasília
  $$
  SELECT
    net.http_post(
        url:='https://oqzpkqbmcnpxpegshlcm.supabase.co/functions/v1/automation-reset-checker',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xenBrcWJtY25weHBlZ3NobGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDY5MzcsImV4cCI6MjA2NDcyMjkzN30.Wla6j2fBOnPd0DbNmVIdhZKfkTp09d9sE8NOULcRsQk"}'::jsonb,
        body:='{"time_based_check": true, "trigger_type": "time_based"}'::jsonb
    ) as request_id;
  $$
);

-- Log da correção de timing
INSERT INTO automation_logs (
  automation_type,
  scheduled_time,
  executed_at,
  execution_status,
  affected_users,
  settings_snapshot
) VALUES (
  'cron_job_timing_fix',
  NOW(),
  NOW(),
  'completed',
  0,
  jsonb_build_object(
    'job_name', 'daily-weekly-ranking-reset-check',
    'old_schedule', '0 0 * * *',
    'new_schedule', '2 3 * * *',
    'old_time_brasilia', '21:00',
    'new_time_brasilia', '00:02',
    'reason', 'Resolver conflito de timing com weekly-competition-finalizer',
    'sequence', 'Reset check (00:02) -> Competition finalizer (00:05)',
    'gap_minutes', 3,
    'fixed_at', NOW()
  )
);