import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedProfile } from './useOptimizedProfile';
import { User } from '@/types';
import { logger } from '@/utils/logger';

interface UnifiedAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | undefined;
}

export const useUnifiedAuth = () => {
  const [authState, setAuthState] = useState<UnifiedAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: undefined
  });

  const isMountedRef = useRef(true);
  const { profile, isLoading: profileLoading, refetch: refetchProfile } = useOptimizedProfile();

  // Função para sincronizar dados do perfil com auth
  const syncUserData = useCallback((sessionUser: any, profileData?: User | null) => {
    if (!isMountedRef.current) return;

    // Priorizar dados do perfil sobre dados da sessão
    const finalUser: User = {
      id: sessionUser.id,
      email: sessionUser.email,
      username: profileData?.username || sessionUser.user_metadata?.username || 'Usuário',
      avatar_url: profileData?.avatar_url || sessionUser.user_metadata?.avatar_url || null,
      total_score: profileData?.total_score || 0,
      games_played: profileData?.games_played || 0,
      experience_points: profileData?.experience_points || 0,
      best_daily_position: profileData?.best_daily_position || null,
      best_weekly_position: profileData?.best_weekly_position || null,
      pix_key: profileData?.pix_key || null,
      pix_holder_name: profileData?.pix_holder_name || null,
      phone: profileData?.phone || null,
      created_at: profileData?.created_at || sessionUser.created_at,
      updated_at: profileData?.updated_at || sessionUser.updated_at,
    };

    logger.info('🔄 SINCRONIZANDO DADOS DO USUÁRIO', {
      userId: finalUser.id,
      username: finalUser.username,
      hasAvatar: !!finalUser.avatar_url,
      hasProfileData: !!profileData,
      experiencePoints: finalUser.experience_points
    }, 'UNIFIED_AUTH');

    setAuthState(prev => ({
      ...prev,
      user: finalUser,
      isAuthenticated: true,
      error: undefined
    }));
  }, []);

  // Processar mudanças de autenticação
  const handleAuthChange = useCallback(async (event: string, session: any) => {
    if (!isMountedRef.current) return;

    logger.info('🔐 MUDANÇA DE AUTENTICAÇÃO DETECTADA', {
      event,
      hasSession: !!session,
      userId: session?.user?.id
    }, 'UNIFIED_AUTH');

    if (session?.user) {
      // Usuário logado - começar com dados básicos da sessão
      setAuthState(prev => ({
        ...prev,
        isLoading: true,
        error: undefined
      }));

      // Sincronizar com dados básicos primeiro
      syncUserData(session.user);

      // Aguardar dados do perfil
      try {
        await refetchProfile();
      } catch (error) {
        logger.warn('⚠️ Falha ao carregar perfil, usando dados da sessão', { error }, 'UNIFIED_AUTH');
      }
    } else {
      // Usuário deslogado
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: undefined
      });
    }
  }, [syncUserData, refetchProfile]);

  // Sincronizar quando dados do perfil forem carregados/atualizados
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && profile) {
      logger.info('📊 PERFIL CARREGADO - ATUALIZANDO DADOS DO USUÁRIO', {
        userId: profile.id,
        username: profile.username,
        hasAvatar: !!profile.avatar_url
      }, 'UNIFIED_AUTH');

      syncUserData(authState.user, profile);
    }
  }, [profile, authState.isAuthenticated, authState.user, syncUserData]);

  // Configurar listener de autenticação
  useEffect(() => {
    isMountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange('INITIAL_SESSION', session);
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [handleAuthChange]);

  // Atualizar isLoading baseado no estado do perfil
  useEffect(() => {
    if (authState.isAuthenticated) {
      setAuthState(prev => ({
        ...prev,
        isLoading: profileLoading
      }));
    }
  }, [profileLoading, authState.isAuthenticated]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const login = useCallback(async (credentials: { emailOrPhone: string; password: string; rememberMe?: boolean }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.emailOrPhone,
        password: credentials.password
      });

      if (error) throw error;

      logger.info('✅ LOGIN REALIZADO COM SUCESSO', { userId: data.user.id }, 'UNIFIED_AUTH');
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro no login'
      }));
      logger.error('❌ FALHA NO LOGIN', { error: error.message }, 'UNIFIED_AUTH');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      logger.info('✅ LOGOUT REALIZADO COM SUCESSO', undefined, 'UNIFIED_AUTH');
    } catch (error: any) {
      logger.error('❌ ERRO NO LOGOUT', { error: error.message }, 'UNIFIED_AUTH');
    }
  }, []);

  const register = useCallback(async (userData: { emailOrPhone: string; password: string; username: string }) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));

      const { data, error } = await supabase.auth.signUp({
        email: userData.emailOrPhone,
        password: userData.password,
        options: {
          data: { username: userData.username },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      logger.info('✅ REGISTRO REALIZADO COM SUCESSO', { userId: data.user?.id }, 'UNIFIED_AUTH');
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro no registro'
      }));
      logger.error('❌ FALHA NO REGISTRO', { error: error.message }, 'UNIFIED_AUTH');
    }
  }, []);

  const resetPassword = useCallback(async (emailOrPhone: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));

      const { error } = await supabase.auth.resetPasswordForEmail(emailOrPhone, {
        redirectTo: `${window.location.origin}/`
      });

      if (error) throw error;

      setAuthState(prev => ({ ...prev, isLoading: false }));
      logger.info('✅ EMAIL DE RECUPERAÇÃO ENVIADO', { emailOrPhone }, 'UNIFIED_AUTH');
      return { success: true };
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro ao enviar email de recuperação'
      }));
      logger.error('❌ FALHA NO RESET DE SENHA', { error: error.message }, 'UNIFIED_AUTH');
      return { success: false, error: error.message };
    }
  }, []);

  return {
    ...authState,
    login,
    logout,
    register,
    resetPassword
  };
};