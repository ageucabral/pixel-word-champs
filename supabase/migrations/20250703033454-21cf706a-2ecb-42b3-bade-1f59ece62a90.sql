-- Renomear e especializar job para competições diárias apenas
-- Remover job unificado e criar job específico para competições diárias

-- 1. Remover job unificado existente
SELECT cron.unschedule('unified-competitions-status-update');

-- 2. Criar função especializada para competições diárias
CREATE OR REPLACE FUNCTION public.update_daily_competitions_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_utc TIMESTAMP WITH TIME ZONE;
  current_brasilia TIMESTAMP WITH TIME ZONE;
  updated_count INTEGER := 0;
  competitions_updated jsonb := '[]'::jsonb;
  comp_record RECORD;
BEGIN
  -- Obter horários atuais
  current_utc := NOW();
  current_brasilia := current_utc AT TIME ZONE 'America/Sao_Paulo';
  
  RAISE NOTICE 'DAILY UPDATE: Iniciando atualização de competições diárias às % UTC (% Brasília)', 
    current_utc, current_brasilia;

  -- PROCESSAR APENAS COMPETIÇÕES DIÁRIAS (challenge) com timezone Brasília
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
        
        updated_count := updated_count + 1;
        
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
        
        RAISE NOTICE 'DAILY CHALLENGE: % (%) atualizada: % -> % (Brasília)', 
          comp_record.title, comp_record.id, old_status, correct_status;
      END IF;
    END;
  END LOOP;
  
  RAISE NOTICE 'DAILY UPDATE: Concluída - % competições diárias atualizadas', updated_count;
  
  RETURN jsonb_build_object(
    'success', true,
    'daily_challenges_updated', updated_count,
    'competitions_updated', competitions_updated,
    'executed_at_utc', current_utc,
    'executed_at_brasilia', current_brasilia,
    'function_version', 'daily_only_v1.0'
  );
END;
$$;

-- 3. Criar novo cron job especializado para competições diárias
SELECT cron.schedule(
  'daily-competitions-status-update',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT public.update_daily_competitions_status();
  $$
);

-- 4. Executar uma vez para testar a nova função
SELECT public.update_daily_competitions_status();

-- 5. Log da modificação
INSERT INTO automation_logs (
  automation_type,
  scheduled_time,
  executed_at,
  execution_status,
  settings_snapshot,
  affected_users,
  error_message
) VALUES (
  'cron_job_specialization',
  NOW(),
  NOW(),
  'completed',
  jsonb_build_object(
    'action', 'rename_and_specialize_job',
    'removed_job', 'unified-competitions-status-update',
    'created_job', 'daily-competitions-status-update',
    'created_function', 'update_daily_competitions_status',
    'schedule', '*/5 * * * *',
    'specialization', 'Apenas competições diárias (challenge) com timezone Brasília',
    'description', 'Job especializado para atualizar status de competições diárias a cada 5 minutos'
  ),
  0,
  NULL
);

-- Comentário final
COMMENT ON FUNCTION public.update_daily_competitions_status() IS 'Função especializada para atualizar status APENAS de competições diárias (challenge) usando timezone de Brasília - executa a cada 5 minutos';