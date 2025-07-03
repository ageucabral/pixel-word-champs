-- Adicionar suporte para telefones únicos na tabela profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Criar índice para busca eficiente por telefone
CREATE INDEX idx_profiles_phone ON public.profiles (phone) WHERE phone IS NOT NULL;

-- Função para buscar usuário por telefone ou email
CREATE OR REPLACE FUNCTION public.find_user_by_email_or_phone(identifier text)
RETURNS TABLE(user_id uuid, email text, phone text, username text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o identifier é um telefone (começa com +)
  IF identifier LIKE '+%' THEN
    RETURN QUERY
    SELECT p.id, au.email, p.phone, p.username
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE p.phone = identifier;
  ELSE
    -- Se o identifier é um email
    RETURN QUERY
    SELECT p.id, au.email, p.phone, p.username
    FROM profiles p
    LEFT JOIN auth.users au ON p.id = au.id
    WHERE au.email = identifier;
  END IF;
END;
$$;