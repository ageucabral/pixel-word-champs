
import { useState, useEffect } from 'react';
import { profileService } from '@/services/profileService';
import { User } from '@/types';
import { useAuth } from './useAuth';

export const useProfile = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  const fetchProfile = async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

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
    }
  };

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

  // Sincronizar com mudanças de autenticação e usuário
  useEffect(() => {
    fetchProfile();
  }, [isAuthenticated, user?.id]);

  // REMOVER sincronização automática que pode sobrescrever dados corretos
  // Agora o perfil vem SEMPRE da base de dados via fetchProfile

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile
  };
};
