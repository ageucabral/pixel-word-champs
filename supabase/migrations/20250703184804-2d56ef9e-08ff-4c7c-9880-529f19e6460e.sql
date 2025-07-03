-- Limpar dados duplicados de invite_rewards e corrigir status baseado na atividade real

-- 1. Primeiro, identificar usuários com 5+ dias de atividade
WITH users_with_5_days AS (
  SELECT user_id, COUNT(DISTINCT activity_date) as days_count
  FROM user_activity_days
  GROUP BY user_id
  HAVING COUNT(DISTINCT activity_date) >= 5
),

-- 2. Identificar registros duplicados (múltiplas recompensas para o mesmo convite)
duplicated_rewards AS (
  SELECT user_id, invited_user_id, invite_code, COUNT(*) as count
  FROM invite_rewards
  GROUP BY user_id, invited_user_id, invite_code
  HAVING COUNT(*) > 1
),

-- 3. Identificar registros 'processed' indevidos (usuários sem 5+ dias de atividade)
invalid_processed AS (
  SELECT ir.id, ir.user_id, ir.invited_user_id, ir.invite_code, ir.status
  FROM invite_rewards ir
  LEFT JOIN users_with_5_days u5d ON u5d.user_id = ir.invited_user_id
  WHERE ir.status = 'processed' AND u5d.user_id IS NULL
)

-- Corrigir registros 'processed' indevidos para 'partial'
UPDATE invite_rewards 
SET 
  status = 'partial',
  reward_amount = 5,
  processed_at = NULL
WHERE id IN (SELECT id FROM invalid_processed);

-- Remover registros duplicados, mantendo apenas o mais recente de cada grupo
WITH ranked_duplicates AS (
  SELECT 
    ir.id,
    ir.user_id,
    ir.invited_user_id,
    ir.invite_code,
    ir.status,
    ir.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY ir.user_id, ir.invited_user_id, ir.invite_code 
      ORDER BY 
        CASE WHEN ir.status = 'processed' THEN 1 ELSE 2 END,
        ir.created_at DESC
    ) as rn
  FROM invite_rewards ir
  WHERE EXISTS (
    SELECT 1 FROM duplicated_rewards dr 
    WHERE dr.user_id = ir.user_id 
      AND dr.invited_user_id = ir.invited_user_id 
      AND dr.invite_code = ir.invite_code
  )
)
DELETE FROM invite_rewards 
WHERE id IN (
  SELECT id FROM ranked_duplicates WHERE rn > 1
);

-- Verificar resultados da limpeza
SELECT 
  'Registros após limpeza:' as info,
  ir.user_id,
  p1.username as indicador,
  ir.invited_user_id,
  p2.username as indicado,
  ir.invite_code,
  ir.status,
  ir.reward_amount,
  COALESCE(u5d.days_count, 0) as dias_atividade
FROM invite_rewards ir
LEFT JOIN profiles p1 ON p1.id = ir.user_id
LEFT JOIN profiles p2 ON p2.id = ir.invited_user_id
LEFT JOIN (
  SELECT user_id, COUNT(DISTINCT activity_date) as days_count
  FROM user_activity_days
  GROUP BY user_id
) u5d ON u5d.user_id = ir.invited_user_id
WHERE ir.user_id = 'dafccd97-e393-4f8c-9feb-d48c25cd366e'  -- ageucabral
   OR ir.invited_user_id = 'dafccd97-e393-4f8c-9feb-d48c25cd366e'
ORDER BY ir.created_at;