
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { profileService } from '@/services/profileService';
import { User } from '@/types';
import { useAuth } from './useAuth';

export const useProfile = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  
  // Controle de execução para evitar loops
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);

  const fetchProfile = useCallback(async () => {
    // Debounce - evitar múltiplas chamadas simultâneas
    const now = Date.now();
    if (fetchingRef.current || (now - lastFetchRef.current < 1000)) {
      return;
    }

    if (!isAuthenticated) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    fetchingRef.current = true;
    lastFetchRef.current = now;
    setIsLoading(true);
    setError(null);

    try {
      const response = await profileService.getCurrentProfile();
      if (response.success && response.data) {
        setProfile(response.data);
        setError(null);
      } else {
        setError(response.error || 'Erro ao carregar perfil');
        setProfile(null);
      }
    } catch (err) {
      setError('Erro ao carregar perfil do usuário');
      setProfile(null);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [isAuthenticated]);

  const updateProfile = async (updates: Partial<{ username: string; avatar_url: string; phone: string; pix_key: string; pix_holder_name: string }>) => {
    try {
      const response = await profileService.updateProfile(updates);
      if (response.success && response.data) {
        setProfile(response.data);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: 'Erro ao atualizar perfil' };
    }
  };

  // Sincronizar apenas com mudanças de autenticação (sem user.id para evitar loops)
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Memoizar resultado para evitar re-renders desnecessários
  const memoizedResult = useMemo(() => ({
    profile,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile
  }), [profile, isLoading, error, updateProfile, fetchProfile]);

  return memoizedResult;
};
