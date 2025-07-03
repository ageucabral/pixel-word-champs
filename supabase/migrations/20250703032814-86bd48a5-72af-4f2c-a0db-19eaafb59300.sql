-- Criar cron job de reset com timing correto para resolver conflito
-- Novo horário: 03:02 UTC (00:02 Brasília) - 3 minutos antes da finalização

-- Criar job com horário sequencial
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

-- Log da implementação da solução de timing
INSERT INTO automation_logs (
  automation_type,
  scheduled_time,
  executed_at,
  execution_status,
  affected_users,
  settings_snapshot
) VALUES (
  'cron_job_timing_solution',
  NOW(),
  NOW(),
  'completed',
  0,
  jsonb_build_object(
    'job_name', 'daily-weekly-ranking-reset-check',
    'schedule', '2 3 * * *',
    'time_brasilia', '00:02',
    'solution', 'Sequência temporal: Reset (00:02) -> Finalização (00:05)',
    'gap_minutes', 3,
    'prevents_conflicts', true,
    'coordinated_with', 'weekly-competition-finalizer',
    'implemented_at', NOW()
  )
);