
import { supabase } from '@/integrations/supabase/client';
import { createFallbackUser, createTimeoutPromise } from './authHelpers';
import { mapUserFromProfile } from './userMapper';
import { logger } from './logger';

// Cache local para perfil
const PROFILE_CACHE_KEY = 'cached_profile';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em ms

// Função para obter perfil do cache
const getCachedProfile = (): any | null => {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_TTL;
    
    if (isExpired) {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
};

// Função para salvar perfil no cache
const setCachedProfile = (profile: any) => {
  try {
    const cacheData = {
      data: profile,
      timestamp: Date.now()
    };
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    // Falhar silenciosamente se localStorage não estiver disponível
  }
};

// Circuit breaker para evitar loops infinitos
const CIRCUIT_BREAKER_KEY = 'auth_circuit_breaker';
const CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutos

const isCircuitBreakerOpen = () => {
  const breakerData = localStorage.getItem(CIRCUIT_BREAKER_KEY);
  if (!breakerData) return false;
  
  const { failures, lastFailure } = JSON.parse(breakerData);
  return failures >= 3 && (Date.now() - lastFailure) < CIRCUIT_BREAKER_TIMEOUT;
};

const updateCircuitBreaker = (success: boolean) => {
  const breakerData = localStorage.getItem(CIRCUIT_BREAKER_KEY);
  const data = breakerData ? JSON.parse(breakerData) : { failures: 0, lastFailure: 0 };
  
  if (success) {
    localStorage.removeItem(CIRCUIT_BREAKER_KEY);
  } else {
    data.failures += 1;
    data.lastFailure = Date.now();
    localStorage.setItem(CIRCUIT_BREAKER_KEY, JSON.stringify(data));
  }
};

// Função auxiliar para buscar perfil com retry otimizado
const fetchProfileWithRetry = async (
  session: any,
  callbacks: AuthCallbacks,
  isMountedRef: React.MutableRefObject<boolean>,
  maxRetries = 3 // Reduzido para 3 tentativas
) => {
  const { setUser, setIsLoading } = callbacks;
  
  // Detectar se é refresh ou login inicial
  const isPageRefresh = performance.navigation?.type === 1 || 
                       document.referrer === window.location.href;
  
  logger.info('📊 INICIANDO BUSCA DE PERFIL COM RETRY OTIMIZADO', { 
    maxRetries, 
    userId: session.user.id,
    isPageRefresh,
    circuitBreakerOpen: isCircuitBreakerOpen()
  }, 'AUTH_PROCESSOR');

  // Verificar circuit breaker - se aberto, usar apenas cache/fallback
  if (isCircuitBreakerOpen()) {
    logger.warn('🚧 CIRCUIT BREAKER ATIVO - USANDO APENAS CACHE/FALLBACK', { 
      userId: session.user.id 
    }, 'AUTH_PROCESSOR');
    
    const cachedProfile = getCachedProfile();
    if (cachedProfile && cachedProfile.id === session.user.id) {
      const fallbackUserData = mapUserFromProfile(cachedProfile, session.user);
      setUser(fallbackUserData);
    }
    return;
  }

  // Verificar se há perfil no cache e usar como fallback inicial
  const cachedProfile = getCachedProfile();
  if (cachedProfile && cachedProfile.id === session.user.id) {
    logger.info('📦 USANDO PERFIL DO CACHE COMO FALLBACK', { 
      userId: cachedProfile.id,
      username: cachedProfile.username 
    }, 'AUTH_PROCESSOR');
    
    const fallbackUserData = mapUserFromProfile(cachedProfile, session.user);
    setUser(fallbackUserData);
  }

  let hasSuccess = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (!isMountedRef.current) return;

    try {
      logger.debug(`🔄 TENTATIVA ${attempt}/${maxRetries} DE BUSCA DE PERFIL`, {
        attempt,
        maxRetries,
        hasCache: !!cachedProfile
      }, 'AUTH_PROCESSOR');

      // Backoff reduzido: 500ms, 1s, 2s
      const delayMs = Math.min(Math.pow(2, attempt - 1) * 500, 2000);
      
      // Query otimizada em duas etapas - primeiro dados essenciais
      const essentialPromise = supabase
        .from('profiles')
        .select('id, username, experience_points, total_score')
        .eq('id', session.user.id)
        .maybeSingle();

      const startTime = Date.now();
      const { data: essentialData, error: essentialError } = await Promise.race([
        essentialPromise,
        createTimeoutPromise(20000) // Timeout de 20 segundos
      ]);
      const responseTime = Date.now() - startTime;

      logger.debug(`⏱️ TEMPO DE RESPOSTA (DADOS ESSENCIAIS): ${responseTime}ms`, { 
        attempt, 
        responseTime 
      }, 'AUTH_PROCESSOR');

      if (!isMountedRef.current) return;

      if (essentialError && essentialError.code !== 'PGRST116') {
        logger.warn(`⚠️ ERRO NA TENTATIVA ${attempt}/${maxRetries}`, { 
          error: essentialError.message,
          code: essentialError.code,
          responseTime
        }, 'AUTH_PROCESSOR');
        
        if (attempt === maxRetries) {
          logger.error('❌ TODAS AS TENTATIVAS DE BUSCA FALHARAM', { 
            error: essentialError.message,
            totalTime: responseTime 
          }, 'AUTH_PROCESSOR');
          return;
        }
        
        // Backoff exponencial antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      if (essentialData) {
        // Verificar se dados essenciais estão completos
        const hasEssentialData = essentialData.username && 
                                essentialData.experience_points !== undefined &&
                                essentialData.total_score !== undefined;

        if (hasEssentialData) {
          // Buscar dados completos do perfil
          const fullPromise = supabase
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

          const { data: fullProfile, error: fullError } = await Promise.race([
            fullPromise,
            createTimeoutPromise(20000)
          ]);

          if (fullProfile && !fullError) {
            const fullUserData = mapUserFromProfile(fullProfile, session.user);
            setUser(fullUserData);
            
            // Salvar perfil completo no cache
            setCachedProfile(fullProfile);
            
            logger.info('🎯 PERFIL COMPLETO CARREGADO E CACHEADO', { 
              userId: fullUserData.id,
              username: fullUserData.username,
              experiencePoints: fullUserData.experience_points,
              totalScore: fullUserData.total_score,
              attempt,
              totalTime: Date.now() - startTime
            }, 'AUTH_PROCESSOR');
            
            hasSuccess = true;
            updateCircuitBreaker(true);
            return; // Sucesso total
          } else {
            // Usar dados essenciais como fallback
            const essentialUserData = mapUserFromProfile(essentialData, session.user);
            setUser(essentialUserData);
            
            logger.info('📝 USANDO DADOS ESSENCIAIS COMO FALLBACK', { 
              userId: essentialUserData.id,
              username: essentialUserData.username,
              attempt
            }, 'AUTH_PROCESSOR');
            return;
          }
        } else {
          logger.warn(`⚠️ DADOS ESSENCIAIS INCOMPLETOS NA TENTATIVA ${attempt}`, { 
            hasUsername: !!essentialData.username,
            hasXP: essentialData.experience_points !== undefined,
            hasScore: essentialData.total_score !== undefined
          }, 'AUTH_PROCESSOR');
          
          if (attempt === maxRetries) {
            // Na última tentativa, usar o que conseguimos
            const partialUserData = mapUserFromProfile(essentialData, session.user);
            setUser(partialUserData);
            logger.warn('📝 USANDO DADOS PARCIAIS - TENTATIVAS ESGOTADAS', undefined, 'AUTH_PROCESSOR');
            return;
          }
        }
      } else {
        logger.warn(`📝 NENHUM DADO ENCONTRADO NA TENTATIVA ${attempt}/${maxRetries}`, undefined, 'AUTH_PROCESSOR');
        
        if (attempt === maxRetries) {
          logger.info('📝 MANTENDO DADOS FALLBACK/CACHE', undefined, 'AUTH_PROCESSOR');
          return;
        }
      }

      // Backoff exponencial antes da próxima tentativa
      if (attempt < maxRetries) {
        logger.debug(`⏳ AGUARDANDO ${delayMs}ms ANTES DA PRÓXIMA TENTATIVA`, { 
          delayMs, 
          nextAttempt: attempt + 1 
        }, 'AUTH_PROCESSOR');
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

    } catch (error) {
      const isTimeout = error instanceof Error && error.message.includes('Timeout');
      logger.warn(`${isTimeout ? '⏰' : '❌'} ${isTimeout ? 'TIMEOUT' : 'ERRO'} NA TENTATIVA ${attempt}/${maxRetries}`, { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        attempt,
        isTimeout
      }, 'AUTH_PROCESSOR');

      if (attempt === maxRetries) {
        logger.warn('⏰ TIMEOUT/ERRO FINAL - MANTENDO DADOS EXISTENTES', { 
          fallbackActive: true
        }, 'AUTH_PROCESSOR');
        return;
      }

      // Backoff exponencial para erros também
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
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

    // PRIORIDADE 2: Buscar perfil completo com retry e timeout menor
    logger.info('📊 INICIANDO BUSCA DE PERFIL', { userId: session.user?.id }, 'AUTH_PROCESSOR');
    
    // Timeout global reduzido para evitar que o processamento trave
    const profileFetchPromise = fetchProfileWithRetry(session, callbacks, isMountedRef);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout na busca de perfil')), 8000) // Reduzido para 8s
    );

    try {
      await Promise.race([profileFetchPromise, timeoutPromise]);
      logger.info('📊 BUSCA DE PERFIL CONCLUÍDA', { userId: session.user?.id }, 'AUTH_PROCESSOR');
    } catch (profileError: any) {
      logger.warn('⚠️ ERRO/TIMEOUT NA BUSCA DE PERFIL - CONTINUANDO COM DADOS FALLBACK', { 
        error: profileError.message,
        userId: session.user?.id 
      }, 'AUTH_PROCESSOR');
      
      // Atualizar circuit breaker em caso de falha
      updateCircuitBreaker(false);
      
      // Continuar com dados fallback - não falhar a autenticação
    }

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
