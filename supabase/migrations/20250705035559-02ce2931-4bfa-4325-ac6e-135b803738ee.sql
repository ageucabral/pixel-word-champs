-- Melhorar função finalize_weekly_competition para detectar automaticamente competições expiradas

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
  
  -- NOVA LÓGICA: Buscar competição 'completed' que precisa de snapshot
  -- Priorizar a mais recente que ainda não tem snapshot
  SELECT * INTO competition_to_finalize 
  FROM weekly_config 
  WHERE status = 'completed' 
    AND NOT EXISTS (
      SELECT 1 FROM weekly_competitions_snapshot 
      WHERE competition_id = weekly_config.id
    )
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- Se não houver competição para finalizar, retornar informação útil
  IF competition_to_finalize IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhuma competição completed precisa de snapshot',
      'active_competitions', (SELECT COUNT(*) FROM weekly_config WHERE status = 'active'),
      'completed_with_snapshot', (SELECT COUNT(*) FROM weekly_config wc 
        WHERE status = 'completed' AND EXISTS (
          SELECT 1 FROM weekly_competitions_snapshot WHERE competition_id = wc.id
        )),
      'completed_without_snapshot', (SELECT COUNT(*) FROM weekly_config wc 
        WHERE status = 'completed' AND NOT EXISTS (
          SELECT 1 FROM weekly_competitions_snapshot WHERE competition_id = wc.id
        ))
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
  
  -- CRIAR SNAPSHOT PRIMEIRO (SEGURANÇA)
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
  
  -- APENAS APÓS SNAPSHOT: resetar pontuações e quantidade de jogos
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
      'security_status', 'snapshot_created_before_reset',
      'winners_preserved', jsonb_array_length(COALESCE(winners_snapshot, '[]'::jsonb)),
      'total_participants_preserved', jsonb_array_length(COALESCE(rankings_snapshot, '[]'::jsonb))
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'snapshot_id', snapshot_id,
    'finalized_competition', competition_to_finalize,
    'activated_competition', scheduled_config,
    'profiles_reset', affected_profiles,
    'winners_count', jsonb_array_length(COALESCE(winners_snapshot, '[]'::jsonb)),
    'total_participants', jsonb_array_length(COALESCE(rankings_snapshot, '[]'::jsonb)),
    'security_status', 'snapshot_created_safely',
    'process_order', 'Status Update -> Snapshot Creation -> Profile Reset -> Next Competition Activation'
  );
END;
$$;