-- Corrigir sistema de finalização semanal removendo cron job problemático
-- e garantindo que apenas o processo completo seja usado

-- 1. REMOVER CRON JOB PROBLEMÁTICO que chama edge function inexistente
SELECT cron.unschedule('daily-weekly-ranking-reset-check');

-- 2. Verificar e garantir que o cron correto existe e está funcionando
-- Verificar se weekly-competition-finalizer existe
DO $$
BEGIN
  -- Se não existir o job correto, criar
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'weekly-competition-finalizer'
  ) THEN
    PERFORM cron.schedule(
      'weekly-competition-finalizer',
      '5 3 * * *', -- 03:05 UTC = 00:05 Brasília
      $$
      SELECT
        net.http_post(
          url := 'https://oqzpkqbmcnpxpegshlcm.supabase.co/functions/v1/weekly-competition-finalizer',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xenBrcWJtY25weHBlZ3NobGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE0NjkzNywiZXhwIjoyMDY0NzIyOTM3fQ.H8vx1BVlYa9gJVGl7eP7m6H-0HLxDLKKR_7L0NtKWZk"}'::jsonb,
          body := '{}'::jsonb
        ) as request_id;
      $$
    );
    RAISE NOTICE 'Cron job weekly-competition-finalizer criado';
  END IF;
END $$;

-- 3. Adicionar função de proteção para evitar reset sem snapshot
CREATE OR REPLACE FUNCTION public.prevent_unsafe_score_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- 4. Atualizar função finalize para detectar automaticamente competições expiradas
CREATE OR REPLACE FUNCTION public.finalize_weekly_competition()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  competition_to_finalize RECORD;
  scheduled_config RECORD;
  winners_snapshot JSONB;
  rankings_snapshot JSONB;
  affected_profiles INTEGER;
  snapshot_id UUID;
BEGIN
  -- Primeiro, atualizar status de competições que expiraram
  UPDATE weekly_config 
  SET status = 'completed', completed_at = NOW()
  WHERE status = 'active' AND end_date < CURRENT_DATE;
  
  -- Buscar competição 'completed' que precisa de snapshot
  SELECT * INTO competition_to_finalize 
  FROM weekly_config 
  WHERE status = 'completed' 
    AND NOT EXISTS (
      SELECT 1 FROM weekly_competitions_snapshot 
      WHERE competition_id = weekly_config.id
    )
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- Se não houver competição para finalizar, retornar
  IF competition_to_finalize IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhuma competição completed precisa de snapshot'
    );
  END IF;
  
  -- Capturar dados dos ganhadores (com prêmio > 0)
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', user_id,
      'username', username,
      'position', position,
      'total_score', total_score,
      'prize_amount', prize_amount,
      'pix_key', pix_key,
      'pix_holder_name', pix_holder_name,
      'payment_status', payment_status
    )
  ) INTO winners_snapshot
  FROM weekly_rankings
  WHERE week_start = competition_to_finalize.start_date 
    AND week_end = competition_to_finalize.end_date
    AND prize_amount > 0;
  
  -- Capturar todos os dados do ranking
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', user_id,
      'username', username,
      'position', position,
      'total_score', total_score,
      'prize_amount', prize_amount
    )
  ) INTO rankings_snapshot
  FROM weekly_rankings
  WHERE week_start = competition_to_finalize.start_date 
    AND week_end = competition_to_finalize.end_date;
  
  -- Criar snapshot da competição finalizada
  INSERT INTO weekly_competitions_snapshot (
    competition_id,
    start_date,
    end_date,
    total_participants,
    total_prize_pool,
    winners_data,
    rankings_data
  ) VALUES (
    competition_to_finalize.id,
    competition_to_finalize.start_date,
    competition_to_finalize.end_date,
    (SELECT COUNT(*) FROM weekly_rankings WHERE week_start = competition_to_finalize.start_date),
    (SELECT COALESCE(SUM(prize_amount), 0) FROM weekly_rankings WHERE week_start = competition_to_finalize.start_date),
    COALESCE(winners_snapshot, '[]'::jsonb),
    COALESCE(rankings_snapshot, '[]'::jsonb)
  ) RETURNING id INTO snapshot_id;
  
  -- APENAS AGORA resetar pontuações e quantidade de jogos dos perfis
  UPDATE profiles 
  SET 
    total_score = 0,
    games_played = 0,
    best_weekly_position = NULL,
    updated_at = NOW()
  WHERE total_score > 0 OR games_played > 0 OR best_weekly_position IS NOT NULL;
  
  GET DIAGNOSTICS affected_profiles = ROW_COUNT;
  
  -- Ativar próxima competição agendada se existir
  SELECT * INTO scheduled_config 
  FROM weekly_config 
  WHERE status = 'scheduled' 
  ORDER BY start_date ASC 
  LIMIT 1;
  
  IF scheduled_config IS NOT NULL THEN
    UPDATE weekly_config 
    SET status = 'active', activated_at = NOW()
    WHERE id = scheduled_config.id;
  END IF;
  
  -- Registrar no log de automação
  INSERT INTO automation_logs (
    automation_type,
    scheduled_time,
    executed_at,
    execution_status,
    affected_users,
    settings_snapshot
  ) VALUES (
    'weekly_competition_finalization_secure',
    NOW(),
    NOW(),
    'completed',
    affected_profiles,
    jsonb_build_object(
      'finalized_competition', competition_to_finalize,
      'activated_competition', scheduled_config,
      'snapshot_id', snapshot_id,
      'profiles_reset', affected_profiles,
      'security_check', 'snapshot_created_before_reset'
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'snapshot_id', snapshot_id,
    'finalized_competition', competition_to_finalize,
    'activated_competition', scheduled_config,
    'profiles_reset', affected_profiles,
    'winners_count', jsonb_array_length(COALESCE(winners_snapshot, '[]'::jsonb)),
    'security_status', 'snapshot_created_safely'
  );
END;
$$;

-- 5. Registrar correção no log
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
    'finalization_improved', 'Function now auto-detects expired competitions',
    'process_order', 'Snapshot -> Reset -> New Competition',
    'fixed_at', NOW()
  )
);