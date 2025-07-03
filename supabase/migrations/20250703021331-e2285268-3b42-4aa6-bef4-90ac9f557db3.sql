-- SOLUÇÃO CRÍTICA: Unificar cron jobs conflitantes para competições
-- Remover jobs conflitantes que estão causando classificações incorretas

-- 1. Remover cron jobs conflitantes
SELECT cron.unschedule('update-competition-status'); -- Job ID 1
SELECT cron.unschedule('daily-competitions-status-update'); -- Job ID 4

-- 2. Criar função SQL unificada para processar TODAS as competições
CREATE OR REPLACE FUNCTION public.update_all_competitions_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_utc TIMESTAMP WITH TIME ZONE;
  current_brasilia TIMESTAMP WITH TIME ZONE;
  updated_challenges INTEGER := 0;
  updated_tournaments INTEGER := 0;
  competitions_updated jsonb := '[]'::jsonb;
  comp_record RECORD;
BEGIN
  -- Obter horários atuais
  current_utc := NOW();
  current_brasilia := current_utc AT TIME ZONE 'America/Sao_Paulo';
  
  RAISE NOTICE 'UNIFIED UPDATE: Iniciando atualização unificada às % UTC (% Brasília)', 
    current_utc, current_brasilia;

  -- PROCESSAR COMPETIÇÕES DIÁRIAS (challenge) com timezone Brasília
  FOR comp_record IN 
    SELECT id, title, start_date, end_date, status, competition_type
    FROM custom_competitions 
    WHERE competition_type = 'challenge'
  LOOP
    DECLARE
      correct_status TEXT;
      old_status TEXT := comp_record.status;
      start_brasilia TIMESTAMP WITH TIME ZONE;
      end_brasilia TIMESTAMP WITH TIME ZONE;
    BEGIN
      -- Converter datas UTC para Brasília para comparação
      start_brasilia := comp_record.start_date AT TIME ZONE 'America/Sao_Paulo';
      end_brasilia := comp_record.end_date AT TIME ZONE 'America/Sao_Paulo';
      
      -- Calcular status correto baseado no horário de Brasília
      IF current_brasilia < start_brasilia THEN
        correct_status := 'scheduled';
      ELSIF current_brasilia >= start_brasilia AND current_brasilia < end_brasilia THEN
        correct_status := 'active';
      ELSE
        correct_status := 'completed';
      END IF;
      
      -- Atualizar apenas se o status mudou
      IF old_status != correct_status THEN
        UPDATE custom_competitions 
        SET status = correct_status, updated_at = current_utc
        WHERE id = comp_record.id;
        
        updated_challenges := updated_challenges + 1;
        
        competitions_updated := competitions_updated || jsonb_build_object(
          'id', comp_record.id,
          'title', comp_record.title,
          'type', 'challenge',
          'old_status', old_status,
          'new_status', correct_status,
          'timezone_used', 'Brasilia',
          'current_time', current_brasilia,
          'start_date', start_brasilia,
          'end_date', end_brasilia
        );
        
        RAISE NOTICE 'CHALLENGE: % (%) atualizada: % -> % (Brasília)', 
          comp_record.title, comp_record.id, old_status, correct_status;
      END IF;
    END;
  END LOOP;

  -- PROCESSAR COMPETIÇÕES SEMANAIS (tournament) com UTC
  FOR comp_record IN 
    SELECT id, title, start_date, end_date, status, competition_type
    FROM custom_competitions 
    WHERE competition_type = 'tournament'
  LOOP
    DECLARE
      correct_status TEXT;
      old_status TEXT := comp_record.status;
    BEGIN
      -- Calcular status correto baseado em UTC
      IF current_utc < comp_record.start_date THEN
        correct_status := 'scheduled';
      ELSIF current_utc >= comp_record.start_date AND current_utc < comp_record.end_date THEN
        correct_status := 'active';
      ELSE
        correct_status := 'completed';
      END IF;
      
      -- Atualizar apenas se o status mudou
      IF old_status != correct_status THEN
        UPDATE custom_competitions 
        SET status = correct_status, updated_at = current_utc
        WHERE id = comp_record.id;
        
        updated_tournaments := updated_tournaments + 1;
        
        competitions_updated := competitions_updated || jsonb_build_object(
          'id', comp_record.id,
          'title', comp_record.title,
          'type', 'tournament',
          'old_status', old_status,
          'new_status', correct_status,
          'timezone_used', 'UTC',
          'current_time', current_utc,
          'start_date', comp_record.start_date,
          'end_date', comp_record.end_date
        );
        
        RAISE NOTICE 'TOURNAMENT: % (%) atualizada: % -> % (UTC)', 
          comp_record.title, comp_record.id, old_status, correct_status;
      END IF;
    END;
  END LOOP;
  
  RAISE NOTICE 'UNIFIED UPDATE: Concluída - % challenges, % tournaments atualizadas', 
    updated_challenges, updated_tournaments;
  
  RETURN jsonb_build_object(
    'success', true,
    'challenges_updated', updated_challenges,
    'tournaments_updated', updated_tournaments,
    'total_updated', updated_challenges + updated_tournaments,
    'competitions_updated', competitions_updated,
    'executed_at_utc', current_utc,
    'executed_at_brasilia', current_brasilia,
    'function_version', 'unified_v1.0'
  );
END;
$$;

-- 3. Criar novo cron job unificado
SELECT cron.schedule(
  'unified-competitions-status-update',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT public.update_all_competitions_status();
  $$
);

-- 4. Executar uma vez para corrigir competições classificadas incorretamente
SELECT public.update_all_competitions_status();

-- 5. Log da correção
INSERT INTO automation_logs (
  automation_type,
  scheduled_time,
  executed_at,
  execution_status,
  settings_snapshot,
  affected_users,
  error_message
) VALUES (
  'cron_jobs_unification',
  NOW(),
  NOW(),
  'completed',
  jsonb_build_object(
    'action', 'unified_cron_jobs',
    'removed_jobs', ARRAY['update-competition-status', 'daily-competitions-status-update'],
    'created_job', 'unified-competitions-status-update',
    'schedule', '*/5 * * * *',
    'description', 'Solução para jobs conflitantes que causavam classificações incorretas'
  ),
  0,
  NULL
);

-- Comentário final
COMMENT ON FUNCTION public.update_all_competitions_status() IS 'Função unificada para atualizar status de TODAS as competições (challenge com Brasília, tournament com UTC) - Solução para cron jobs conflitantes';