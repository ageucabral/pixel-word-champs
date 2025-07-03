-- Corrigir indicação perdida do usuário ageucabral2 usando código 4DE7B0FD

-- Primeiro, vamos atualizar o convite para marcar como usado
UPDATE invites 
SET 
  used_by = '4db982d3-b1d5-40a8-b670-95c97fca127d'::uuid,
  used_at = (SELECT created_at FROM profiles WHERE id = '4db982d3-b1d5-40a8-b670-95c97fca127d'::uuid)
WHERE code = '4DE7B0FD' 
  AND invited_by = 'dafccd97-e393-4f8c-9feb-d48c25cd366e'::uuid;

-- Segundo, criar o registro de recompensa que deveria ter sido criado automaticamente
INSERT INTO invite_rewards (
  user_id,
  invited_user_id, 
  invite_code,
  reward_amount,
  status,
  created_at
) VALUES (
  'dafccd97-e393-4f8c-9feb-d48c25cd366e'::uuid, -- ageucabral (quem indicou)
  '4db982d3-b1d5-40a8-b670-95c97fca127d'::uuid, -- ageucabral2 (quem foi indicado)
  '4DE7B0FD',
  5, -- Recompensa inicial (partial)
  'partial', -- Status inicial
  (SELECT created_at FROM profiles WHERE id = '4db982d3-b1d5-40a8-b670-95c97fca127d'::uuid)
) ON CONFLICT DO NOTHING; -- Evitar duplicatas se já existir

-- Verificar se a correção foi aplicada corretamente
SELECT 
  'Convite corrigido:' as tipo,
  i.code,
  i.invited_by,
  i.used_by,
  i.used_at,
  p1.username as indicador,
  p2.username as indicado
FROM invites i
LEFT JOIN profiles p1 ON p1.id = i.invited_by  
LEFT JOIN profiles p2 ON p2.id = i.used_by
WHERE i.code = '4DE7B0FD'

UNION ALL

SELECT 
  'Recompensa criada:' as tipo,
  ir.invite_code as code,
  ir.user_id as invited_by,
  ir.invited_user_id as used_by,
  ir.created_at as used_at,
  p1.username as indicador,
  p2.username as indicado
FROM invite_rewards ir
LEFT JOIN profiles p1 ON p1.id = ir.user_id
LEFT JOIN profiles p2 ON p2.id = ir.invited_user_id  
WHERE ir.invite_code = '4DE7B0FD';