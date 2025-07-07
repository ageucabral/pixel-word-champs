-- Remover funções RPC redundantes para padronização do sistema de XP

-- 1. Remover função redundante update_user_score_simple
DROP FUNCTION IF EXISTS public.update_user_score_simple(uuid, integer);

-- 2. Remover função de teste desnecessária
DROP FUNCTION IF EXISTS public.test_scoring_functions();

-- Criar comentários nas funções remanescentes para documentar claramente o propósito

COMMENT ON FUNCTION public.update_user_scores(uuid, integer, integer) IS 
'FUNÇÃO PRINCIPAL DE PONTUAÇÃO:
- total_score: Pontos para competições e rankings (resetável semanalmente)
- experience_points: XP permanente para sistema de níveis (nunca resetado)
- games_played: Contador total de jogos
- Usar APENAS esta função para atualizar pontuações no jogo';

-- Adicionar comentários nas tabelas para clarificar o uso dos campos
COMMENT ON COLUMN public.profiles.total_score IS 'Pontos temporários para competições e rankings semanais (resetável)';
COMMENT ON COLUMN public.profiles.experience_points IS 'XP permanente para sistema de níveis - usado apenas para cálculo de níveis via usePlayerLevel';
COMMENT ON COLUMN public.profiles.games_played IS 'Contador total de jogos completados pelo usuário';