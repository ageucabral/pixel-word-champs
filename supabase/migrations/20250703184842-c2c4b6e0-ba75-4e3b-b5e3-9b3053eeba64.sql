-- Limpar dados duplicados de invite_rewards e corrigir status baseado na atividade real

-- 1. Primeiro, corrigir registros 'processed' indevidos (usuários sem 5+ dias de atividade)
UPDATE invite_rewards 
SET 
  status = 'partial',
  reward_amount = 5,
  processed_at = NULL
WHERE status = 'processed' 
  AND invited_user_id NOT IN (
    SELECT user_id 
    FROM user_activity_days 
    GROUP BY user_id 
    HAVING COUNT(DISTINCT activity_date) >= 5
  );

-- 2. Remover registros duplicados, mantendo apenas um por convite (o mais recente)
DELETE FROM invite_rewards 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, invited_user_id, invite_code) id
  FROM invite_rewards
  ORDER BY user_id, invited_user_id, invite_code, created_at DESC
);

-- 3. Verificar resultados da limpeza para o usuário ageucabral
SELECT 
  'Registros limpos para ageucabral:' as info,
  ir.id,
  p1.username as indicador,
  p2.username as indicado,
  ir.invite_code,
  ir.status,
  ir.reward_amount,
  COALESCE(activity_days.dias, 0) as dias_atividade,
  ir.created_at
FROM invite_rewards ir
LEFT JOIN profiles p1 ON p1.id = ir.user_id
LEFT JOIN profiles p2 ON p2.id = ir.invited_user_id
LEFT JOIN (
  SELECT user_id, COUNT(DISTINCT activity_date) as dias
  FROM user_activity_days
  GROUP BY user_id
) activity_days ON activity_days.user_id = ir.invited_user_id
WHERE ir.user_id = 'dafccd97-e393-4f8c-9feb-d48c25cd366e'  -- ageucabral
ORDER BY ir.created_at;