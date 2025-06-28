
-- Corrigir a função get_monthly_invite_stats para calcular corretamente o pool de prêmios
CREATE OR REPLACE FUNCTION public.get_monthly_invite_stats(target_month text DEFAULT to_char(current_date, 'YYYY-MM'))
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  competition_record RECORD;
  stats jsonb;
  calculated_prize_pool numeric := 0;
  participants_count integer := 0;
  rankings_data jsonb;
  top_performers_data jsonb;
BEGIN
  -- Buscar ou criar competição do mês
  SELECT * INTO competition_record 
  FROM monthly_invite_competitions 
  WHERE month_year = target_month;
  
  -- Se não houver competição, criar uma automaticamente
  IF competition_record IS NULL THEN
    INSERT INTO monthly_invite_competitions (
      month_year,
      title,
      description,
      start_date,
      end_date,
      status
    ) VALUES (
      target_month,
      'Competição de Indicações - ' || to_char(to_date(target_month, 'YYYY-MM'), 'Month YYYY'),
      'Competição mensal baseada em indicações de novos usuários',
      (target_month || '-01')::date,
      (date_trunc('month', (target_month || '-01')::date) + interval '1 month - 1 day')::date,
      CASE 
        WHEN target_month = to_char(current_date, 'YYYY-MM') THEN 'active'
        WHEN target_month < to_char(current_date, 'YYYY-MM') THEN 'completed'
        ELSE 'scheduled'
      END
    ) RETURNING * INTO competition_record;
  END IF;
  
  -- Calcular o pool de prêmios SEMPRE baseado nos prêmios configurados
  SELECT COALESCE(SUM(prize_amount), 0) INTO calculated_prize_pool
  FROM monthly_invite_prizes mip
  WHERE mip.competition_id = competition_record.id AND mip.active = true;
  
  -- Calcular ranking dinamicamente baseado nos convites reais
  WITH monthly_data AS (
    SELECT 
      p.id as user_id,
      p.username,
      p.pix_key,
      p.pix_holder_name,
      COUNT(i.id) as invites_count,
      COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) as active_invites_count,
      -- Pontos: 10 por convite + 40 bonus por convite ativo
      (COUNT(i.id) * 10 + COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) * 40) as invite_points,
      ROW_NUMBER() OVER (
        ORDER BY 
          (COUNT(i.id) * 10 + COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) * 40) DESC, 
          COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) DESC, 
          COUNT(i.id) DESC
      ) as position
    FROM profiles p
    LEFT JOIN invites i ON i.invited_by = p.id 
      AND i.created_at >= competition_record.start_date::timestamp
      AND i.created_at <= (competition_record.end_date + interval '1 day')::timestamp
      AND i.used_by IS NOT NULL
    LEFT JOIN profiles invited_p ON invited_p.id = i.used_by
    WHERE p.username IS NOT NULL
    GROUP BY p.id, p.username, p.pix_key, p.pix_holder_name
    HAVING COUNT(i.id) > 0 OR COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) > 0
  ),
  final_rankings AS (
    SELECT 
      md.*,
      COALESCE(mip.prize_amount, 0) as prize_amount,
      CASE 
        WHEN COALESCE(mip.prize_amount, 0) > 0 THEN 'pending'
        ELSE 'not_eligible'
      END as payment_status
    FROM monthly_data md
    LEFT JOIN monthly_invite_prizes mip ON mip.competition_id = competition_record.id 
      AND mip.position = md.position 
      AND mip.active = true
  )
  -- Calcular dados do ranking
  SELECT 
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'user_id', user_id,
        'username', username,
        'position', position,
        'invite_points', invite_points,
        'invites_count', invites_count,
        'active_invites_count', active_invites_count,
        'prize_amount', prize_amount,
        'payment_status', payment_status,
        'pix_key', pix_key,
        'pix_holder_name', pix_holder_name
      ) ORDER BY position ASC
    ), '[]'::jsonb),
    COALESCE(COUNT(*), 0)
  INTO rankings_data, participants_count
  FROM final_rankings;
  
  -- Calcular top performers separadamente (pode estar vazio)
  WITH top_3_data AS (
    SELECT 
      p.id as user_id,
      p.username,
      p.pix_key,
      p.pix_holder_name,
      COUNT(i.id) as invites_count,
      COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) as active_invites_count,
      (COUNT(i.id) * 10 + COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) * 40) as invite_points,
      ROW_NUMBER() OVER (
        ORDER BY 
          (COUNT(i.id) * 10 + COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) * 40) DESC, 
          COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) DESC, 
          COUNT(i.id) DESC
      ) as position
    FROM profiles p
    LEFT JOIN invites i ON i.invited_by = p.id 
      AND i.created_at >= competition_record.start_date::timestamp
      AND i.created_at <= (competition_record.end_date + interval '1 day')::timestamp
      AND i.used_by IS NOT NULL
    LEFT JOIN profiles invited_p ON invited_p.id = i.used_by
    WHERE p.username IS NOT NULL
    GROUP BY p.id, p.username, p.pix_key, p.pix_holder_name
    HAVING COUNT(i.id) > 0 OR COUNT(CASE WHEN invited_p.games_played > 0 THEN 1 END) > 0
  ),
  top_3_with_prizes AS (
    SELECT 
      t3.*,
      COALESCE(mip.prize_amount, 0) as prize_amount
    FROM top_3_data t3
    LEFT JOIN monthly_invite_prizes mip ON mip.competition_id = competition_record.id 
      AND mip.position = t3.position 
      AND mip.active = true
    WHERE t3.position <= 3
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'username', username,
        'invite_points', invite_points,
        'position', position,
        'prize_amount', prize_amount
      ) ORDER BY position
    ),
    '[]'::jsonb
  ) INTO top_performers_data
  FROM top_3_with_prizes;
  
  -- Atualizar total_prize_pool na competição com o valor calculado dos prêmios
  UPDATE monthly_invite_competitions
  SET 
    total_prize_pool = calculated_prize_pool,
    total_participants = COALESCE(participants_count, 0),
    updated_at = NOW()
  WHERE id = competition_record.id;
  
  -- Atualizar record local
  competition_record.total_prize_pool := calculated_prize_pool;
  competition_record.total_participants := COALESCE(participants_count, 0);
  
  -- SEMPRE retornar dados da competição, mesmo sem participantes
  RETURN jsonb_build_object(
    'competition', jsonb_build_object(
      'id', competition_record.id,
      'month_year', competition_record.month_year,
      'title', competition_record.title,
      'description', competition_record.description,
      'start_date', competition_record.start_date,
      'end_date', competition_record.end_date,
      'status', competition_record.status,
      'total_participants', COALESCE(participants_count, 0),
      'total_prize_pool', calculated_prize_pool,
      'created_at', competition_record.created_at,
      'updated_at', competition_record.updated_at
    ),
    'rankings', COALESCE(rankings_data, '[]'::jsonb),
    'stats', jsonb_build_object(
      'totalParticipants', COALESCE(participants_count, 0),
      'totalPrizePool', calculated_prize_pool,
      'topPerformers', COALESCE(top_performers_data, '[]'::jsonb)
    ),
    'no_active_competition', false,
    'has_participants', COALESCE(participants_count, 0) > 0,
    'last_update', NOW()
  );
END;
$$;
