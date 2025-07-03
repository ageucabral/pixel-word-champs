-- Criar função para gerar código único de convite
CREATE OR REPLACE FUNCTION public.generate_unique_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Gerar código aleatório de 8 caracteres
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Verificar se o código já existe
    SELECT EXISTS (
      SELECT 1 FROM invites WHERE code = new_code
    ) INTO code_exists;
    
    -- Se não existe, retornar o código
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Criar função para criar convite automaticamente
CREATE OR REPLACE FUNCTION public.create_user_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Criar código de convite para o novo usuário
  INSERT INTO invites (
    invited_by,
    code,
    is_active,
    created_at
  ) VALUES (
    NEW.id,
    generate_unique_invite_code(),
    true,
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Criar trigger para gerar código de convite automaticamente
DROP TRIGGER IF EXISTS trigger_create_invite_code ON profiles;
CREATE TRIGGER trigger_create_invite_code
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_invite_code();

-- Corrigir usuários existentes sem código de convite
DO $$
DECLARE
  user_record RECORD;
  new_code text;
BEGIN
  -- Para cada usuário que não tem código de convite
  FOR user_record IN 
    SELECT p.id 
    FROM profiles p
    LEFT JOIN invites i ON i.invited_by = p.id AND i.is_active = true
    WHERE i.id IS NULL
  LOOP
    -- Gerar código único
    new_code := generate_unique_invite_code();
    
    -- Criar convite para o usuário
    INSERT INTO invites (
      invited_by,
      code,
      is_active,
      created_at
    ) VALUES (
      user_record.id,
      new_code,
      true,
      NOW()
    );
    
    RAISE NOTICE 'Código de convite criado para usuário %: %', user_record.id, new_code;
  END LOOP;
END;
$$;