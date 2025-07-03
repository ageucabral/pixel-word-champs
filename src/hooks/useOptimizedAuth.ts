import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { cacheManager, memoryLeakPrevention, performanceMonitor } from '@/utils/performanceOptimizer';
import { logger } from '@/utils/logger';

interface OptimizedAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const CACHE_KEYS = {
  USER_SESSION: 'user_session',
  AUTH_STATE: 'auth_state'
};

const CACHE_DURATION = {
  SESSION: 300000, // 5 minutos
  AUTH_STATE: 60000 // 1 minuto
};

export const useOptimizedAuth = () => {
  const [authState, setAuthState] = useState<OptimizedAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingRef = useRef(false);

  // Função otimizada para verificar sessão
  const checkSession = useCallback(async (retryCount = 0) => {
    if (isProcessingRef.current) return;
    
    const cacheKey = CACHE_KEYS.USER_SESSION;
    const cached = cacheManager.get(cacheKey);
    
    if (cached && retryCount === 0) {
      setAuthState(cached);
      return cached;
    }

    isProcessingRef.current = true;
    
    try {
      performanceMonitor.mark('auth-session-check-start');
      
      // Cancelar requisição anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Erro ao verificar sessão', { error }, 'OPTIMIZED_AUTH');
        throw error;
      }

      const newAuthState: OptimizedAuthState = {
        user: session?.user || null,
        isAuthenticated: !!session?.user,
        isLoading: false,
        error: null
      };

      setAuthState(newAuthState);
      
      // Cache da sessão válida
      if (session?.user) {
        cacheManager.set(cacheKey, newAuthState, CACHE_DURATION.SESSION);
      }
      
      performanceMonitor.measure('auth-session-check-time', 'auth-session-check-start');
      logger.info('Sessão verificada com sucesso', { 
        isAuthenticated: !!session?.user,
        userId: session?.user?.id 
      }, 'OPTIMIZED_AUTH');
      
      return newAuthState;
      
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      logger.error('Erro na verificação de sessão', { error, retryCount }, 'OPTIMIZED_AUTH');
      
      // Retry logic com backoff exponencial
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          checkSession(retryCount + 1);
        }, delay);
        return;
      }
      
      const errorState: OptimizedAuthState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Erro ao verificar autenticação'
      };
      
      setAuthState(errorState);
      return errorState;
      
    } finally {
      isProcessingRef.current = false;
      abortControllerRef.current = null;
    }
  }, []);

  // Login otimizado
  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      performanceMonitor.mark('auth-login-start');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error('Erro no login', { error, email }, 'OPTIMIZED_AUTH');
        throw error;
      }

      const newAuthState: OptimizedAuthState = {
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

      setAuthState(newAuthState);
      
      // Invalidar cache anterior e criar novo
      cacheManager.clear('user_session');
      cacheManager.set(CACHE_KEYS.USER_SESSION, newAuthState, CACHE_DURATION.SESSION);
      
      performanceMonitor.measure('auth-login-time', 'auth-login-start');
      logger.info('Login realizado com sucesso', { userId: data.user.id }, 'OPTIMIZED_AUTH');
      
      return { success: true, user: data.user };
      
    } catch (error: any) {
      const errorState: OptimizedAuthState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Erro no login'
      };
      
      setAuthState(errorState);
      logger.error('Falha no login', { error }, 'OPTIMIZED_AUTH');
      
      return { success: false, error: error.message };
    }
  }, []);

  // Logout otimizado
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      performanceMonitor.mark('auth-logout-start');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Erro no logout', { error }, 'OPTIMIZED_AUTH');
        throw error;
      }

      const loggedOutState: OptimizedAuthState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

      setAuthState(loggedOutState);
      
      // Limpar todos os caches relacionados ao usuário
      cacheManager.clear('user_session');
      cacheManager.clear('user_position');
      cacheManager.clear('ranking');
      
      performanceMonitor.measure('auth-logout-time', 'auth-logout-start');
      logger.info('Logout realizado com sucesso', undefined, 'OPTIMIZED_AUTH');
      
      return { success: true };
      
    } catch (error: any) {
      logger.error('Erro no logout', { error }, 'OPTIMIZED_AUTH');
      return { success: false, error: error.message };
    }
  }, []);

  // Registro otimizado
  const register = useCallback(async (email: string, password: string, username: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      performanceMonitor.mark('auth-register-start');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });

      if (error) {
        logger.error('Erro no registro', { error, email }, 'OPTIMIZED_AUTH');
        throw error;
      }

      const newAuthState: OptimizedAuthState = {
        user: data.user,
        isAuthenticated: !!data.user && !data.user.email_confirmed_at,
        isLoading: false,
        error: null
      };

      setAuthState(newAuthState);
      
      performanceMonitor.measure('auth-register-time', 'auth-register-start');
      logger.info('Registro realizado com sucesso', { userId: data.user?.id }, 'OPTIMIZED_AUTH');
      
      return { success: true, user: data.user };
      
    } catch (error: any) {
      const errorState: OptimizedAuthState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Erro no registro'
      };
      
      setAuthState(errorState);
      logger.error('Falha no registro', { error }, 'OPTIMIZED_AUTH');
      
      return { success: false, error: error.message };
    }
  }, []);

  // Configurar listener de mudanças de auth
  useEffect(() => {
    performanceMonitor.mark('auth-setup-start');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Mudança de estado de auth', { event, userId: session?.user?.id }, 'OPTIMIZED_AUTH');
        
        // Limpar timeout anterior
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
        }
        
        // Invalidar cache em mudanças de auth
        cacheManager.clear('user_session');
        
        const newAuthState: OptimizedAuthState = {
          user: session?.user || null,
          isAuthenticated: !!session?.user,
          isLoading: false,
          error: null
        };

        setAuthState(newAuthState);
        
        // Cache da nova sessão
        if (session?.user) {
          cacheManager.set(CACHE_KEYS.USER_SESSION, newAuthState, CACHE_DURATION.SESSION);
        }
      }
    );
    
    // Verificação inicial
    checkSession();
    
    performanceMonitor.measure('auth-setup-time', 'auth-setup-start');
    
    return () => {
      subscription.unsubscribe();
      
      // Cleanup de memória
      memoryLeakPrevention.cleanupTimers([sessionTimeoutRef]);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkSession]);

  // Verificação periódica otimizada
  useEffect(() => {
    if (!authState.isAuthenticated) return;
    
    const interval = setInterval(() => {
      const cached = cacheManager.get(CACHE_KEYS.USER_SESSION);
      if (!cached) {
        checkSession();
      }
    }, CACHE_DURATION.SESSION);
    
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, checkSession]);

  return {
    ...authState,
    login,
    logout,
    register,
    refetch: checkSession
  };
};