-- Corrigir códigos de convite que não seguem o padrão de 8 caracteres
UPDATE invites 
SET code = generate_unique_invite_code()
WHERE LENGTH(code) != 8;

-- Verificar se a correção foi aplicada
SELECT 
  code,
  LENGTH(code) as code_length,
  invited_by
FROM invites 
WHERE LENGTH(code) != 8;