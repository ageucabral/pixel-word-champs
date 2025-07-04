
import { supabase } from '@/integrations/supabase/client';
import { createFallbackUser, createTimeoutPromise } from './authHelpers';
import { mapUserFromProfile } from './userMapper';
import { logger } from './logger';

// Função auxiliar para buscar perfil com retry
const fetchProfileWithRetry = async (
  session: any,
  callbacks: AuthCallbacks,
  isMountedRef: React.MutableRefObject<boolean>,
  maxRetries = 3
) => {
  const { setUser, setIsLoading } = callbacks;
  
  logger.debug('📊 Iniciando busca de perfil com retry', { 
    maxRetries, 
    userId: session.user.id 
  }, 'AUTH_PROCESSOR');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (!isMountedRef.current) return;

    try {
      logger.debug(`🔄 Tentativa ${attempt}/${maxRetries} de busca de perfil`, undefined, 'AUTH_PROCESSOR');

      const profilePromise = supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          total_score,
          games_played,
          best_daily_position,
          best_weekly_position,
          pix_key,
          pix_holder_name,
          phone,
          experience_points,
          created_at,
          updated_at
        `)
        .eq('id', session.user.id)
        .maybeSingle();

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        createTimeoutPromise(15000) // Aumentado para 15 segundos
      ]);

      if (!isMountedRef.current) return;

      if (profileError && profileError.code !== 'PGRST116') {
        logger.warn(`⚠️ Erro na tentativa ${attempt}/${maxRetries}`, { 
          error: profileError.message,
          code: profileError.code
        }, 'AUTH_PROCESSOR');
        
        if (attempt === maxRetries) {
          logger.error('❌ Todas as tentativas de busca de perfil falharam', { 
            error: profileError.message 
          }, 'AUTH_PROCESSOR');
          return;
        }
        continue; // Tentar novamente
      }

      if (profile) {
        const fullUserData = mapUserFromProfile(profile, session.user);
        
        // Verificar se perfil está completo
        const isProfileComplete = fullUserData.username && 
                                 fullUserData.experience_points !== undefined &&
                                 fullUserData.total_score !== undefined;

        if (isProfileComplete) {
          setUser(fullUserData);
          
          logger.info('🎯 PERFIL COMPLETO CARREGADO COM SUCESSO', { 
            userId: fullUserData.id,
            username: fullUserData.username,
            experiencePoints: fullUserData.experience_points,
            totalScore: fullUserData.total_score,
            attempt
          }, 'AUTH_PROCESSOR');
          return; // Sucesso, sair do loop
        } else {
          logger.warn(`⚠️ Perfil incompleto na tentativa ${attempt}`, { 
            hasUsername: !!fullUserData.username,
            hasXP: fullUserData.experience_points !== undefined,
            hasScore: fullUserData.total_score !== undefined
          }, 'AUTH_PROCESSOR');
          
          if (attempt === maxRetries) {
            // Na última tentativa, usar dados mesmo que incompletos
            setUser(fullUserData);
            logger.warn('📝 USANDO PERFIL INCOMPLETO - todas as tentativas esgotadas', undefined, 'AUTH_PROCESSOR');
          }
        }
      } else {
        logger.warn(`📝 Perfil não encontrado na tentativa ${attempt}/${maxRetries}`, undefined, 'AUTH_PROCESSOR');
        
        if (attempt === maxRetries) {
          logger.info('📝 MANTENDO DADOS FALLBACK - perfil não encontrado após todas as tentativas', undefined, 'AUTH_PROCESSOR');
        }
      }

      // Delay antes da próxima tentativa (exceto na última)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

    } catch (timeoutError) {
      logger.warn(`⏰ TIMEOUT na tentativa ${attempt}/${maxRetries}`, { 
        error: timeoutError instanceof Error ? timeoutError.message : 'Timeout após 15s',
        attempt
      }, 'AUTH_PROCESSOR');

      if (attempt === maxRetries) {
        logger.warn('⏰ TIMEOUT FINAL - mantendo autenticação ativa com dados fallback', { 
          fallbackActive: true
        }, 'AUTH_PROCESSOR');
      }

      // Delay antes da próxima tentativa (exceto na última)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
};

interface AuthCallbacks {
  setUser: (user: any) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
}

export const processUserAuthentication = async (
  session: any,
  callbacks: AuthCallbacks,
  isMountedRef: React.MutableRefObject<boolean>
) => {
  const { setUser, setIsAuthenticated, setIsLoading, setError } = callbacks;

  try {
    logger.info('🔐 INICIANDO PROCESSAMENTO DE AUTENTICAÇÃO', { 
      userId: session.user?.id,
      hasSession: !!session,
      timestamp: new Date().toISOString()
    }, 'AUTH_PROCESSOR');

    // PRIORIDADE 1: Definir autenticado IMEDIATAMENTE se há sessão válida
    if (session?.user?.id) {
      logger.info('✅ SESSÃO VÁLIDA DETECTADA - AUTENTICANDO IMEDIATAMENTE', { 
        userId: session.user.id 
      }, 'AUTH_PROCESSOR');
      
      setIsAuthenticated(true);
      setError(undefined);
      setIsLoading(true);

      // Criar usuário fallback temporário para evitar null state
      const tempUser = createFallbackUser(session);
      setUser(tempUser);
      
      logger.info('👤 USUÁRIO TEMPORÁRIO CRIADO', { 
        userId: tempUser.id,
        username: tempUser.username 
      }, 'AUTH_PROCESSOR');
    }

    // PRIORIDADE 2: Buscar perfil completo com retry e timeout maior
    await fetchProfileWithRetry(session, callbacks, isMountedRef);

  } catch (error: any) {
    logger.error('❌ ERRO CRÍTICO NA AUTENTICAÇÃO', { 
      error: error.message,
      userId: session?.user?.id,
      stack: error.stack
    }, 'AUTH_PROCESSOR');

    if (!isMountedRef.current) return;

    setError('Erro na autenticação');
    setIsAuthenticated(false);
    setUser(null);
  } finally {
    if (isMountedRef.current) {
      setIsLoading(false);
      logger.info('🏁 PROCESSAMENTO DE AUTENTICAÇÃO FINALIZADO', { 
        timestamp: new Date().toISOString()
      }, 'AUTH_PROCESSOR');
    }
  }
};
