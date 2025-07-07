
import { useCallback } from 'react';
import { authService } from '@/services/authService';
import { LoginForm, RegisterForm } from '@/types';
import { useAuthStateCore } from './useAuthStateCore';
import { useAuthRefs } from './useAuthRefs';
import { logger } from '@/utils/logger';

export const useAuthOperations = (
  authState: ReturnType<typeof useAuthStateCore>,
  authRefs: ReturnType<typeof useAuthRefs>
) => {
  const {
    setUser,
    setIsAuthenticated,
    setIsLoading,
    setError,
  } = authState;

  const { isMountedRef } = authRefs;

  const login = useCallback(async (credentials: LoginForm) => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError('');

    try {
      logger.info('Iniciando processo de login', { emailOrPhone: credentials.emailOrPhone }, 'AUTH_OPERATIONS');
      
      const response = await authService.signIn(credentials.emailOrPhone, credentials.password, credentials.rememberMe);
      
      if (!isMountedRef.current) return;

      if (response.data && !response.error) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        setError('');
        logger.info('Login realizado com sucesso', { userId: response.data.user.id }, 'AUTH_OPERATIONS');
      } else {
        const errorMessage = response.error?.message || 'Erro no login';
        setError(errorMessage);
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false); // IMPORTANTE: Parar o loading quando há erro
        logger.error('Falha no login', { error: errorMessage }, 'AUTH_OPERATIONS');
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      const errorMessage = error.message || 'Erro de conexão';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      logger.error('Erro durante login', { error: errorMessage }, 'AUTH_OPERATIONS');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [setUser, setIsAuthenticated, setIsLoading, setError, isMountedRef]);

  const register = useCallback(async (userData: RegisterForm) => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError('');

    try {
      logger.info('Iniciando processo de registro', { emailOrPhone: userData.emailOrPhone, username: userData.username }, 'AUTH_OPERATIONS');
      
      const response = await authService.signUp({
        emailOrPhone: userData.emailOrPhone,
        password: userData.password,
        username: userData.username
      });
      
      if (!isMountedRef.current) return;

      if (response.data && !response.error) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        setError('');
        logger.info('Registro realizado com sucesso', { userId: response.data.user?.id }, 'AUTH_OPERATIONS');
      } else {
        const errorMessage = response.error?.message || 'Erro no registro';
        setError(errorMessage);
        setIsAuthenticated(false);
        setUser(null);
        logger.error('Falha no registro', { error: errorMessage }, 'AUTH_OPERATIONS');
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      const errorMessage = error.message || 'Erro de conexão';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      logger.error('Erro durante registro', { error: errorMessage }, 'AUTH_OPERATIONS');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [setUser, setIsAuthenticated, setIsLoading, setError, isMountedRef]);

  const logout = useCallback(async () => {
    try {
      logger.info('Iniciando logout', undefined, 'AUTH_OPERATIONS');
      await authService.signOut();
      
      if (isMountedRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        setError('');
        logger.info('Logout realizado com sucesso', undefined, 'AUTH_OPERATIONS');
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        const errorMessage = error.message || 'Erro no logout';
        setError(errorMessage);
        logger.error('Erro durante logout', { error: errorMessage }, 'AUTH_OPERATIONS');
      }
    }
  }, [setUser, setIsAuthenticated, setError, isMountedRef]);

  const resetPassword = useCallback(async (emailOrPhone: string) => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError('');

    try {
      logger.info('Iniciando recuperação de senha', { emailOrPhone }, 'AUTH_OPERATIONS');
      
      const response = await authService.resetPassword(emailOrPhone);
      
      if (!isMountedRef.current) return;

      if (response.error) {
        const errorMessage = response.error.message || 'Erro ao enviar email de recuperação';
        setError(errorMessage);
        logger.error('Falha na recuperação de senha', { error: errorMessage }, 'AUTH_OPERATIONS');
        return { success: false, error: errorMessage };
      } else {
        setError('');
        logger.info('Email de recuperação enviado com sucesso', { emailOrPhone }, 'AUTH_OPERATIONS');
        return { success: true };
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      const errorMessage = error.message || 'Erro de conexão';
      setError(errorMessage);
      logger.error('Erro durante recuperação de senha', { error: errorMessage }, 'AUTH_OPERATIONS');
      return { success: false, error: errorMessage };
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [setIsLoading, setError, isMountedRef]);

  return {
    login,
    register,
    logout,
    resetPassword,
  };
};
