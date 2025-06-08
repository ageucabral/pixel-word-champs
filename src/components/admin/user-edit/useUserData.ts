
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUserData = (userId: string, isOpen: boolean) => {
  return useQuery({
    queryKey: ['userData', userId],
    queryFn: async () => {
      console.log('🔍 Buscando dados completos do usuário:', userId);
      
      // Buscar roles atuais
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('❌ Erro ao buscar roles:', rolesError);
        throw rolesError;
      }

      console.log('📋 Roles encontrados:', rolesData);

      // Buscar dados do perfil incluindo email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
      }

      // Determinar email final
      let finalEmail = 'Email não disponível';
      
      try {
        // Primeiro, tentar usar o email salvo na tabela profiles
        if (profileData?.email && profileData.email !== 'Email não disponível') {
          finalEmail = profileData.email;
        } else {
          // Fallback: tentar buscar através do auth se for o usuário atual
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (user && user.id === userId && user.email) {
            finalEmail = user.email;
          } else {
            // Último fallback: usar username como base
            if (profileData?.username) {
              if (profileData.username.includes('@')) {
                finalEmail = profileData.username;
              } else {
                finalEmail = `${profileData.username}@sistema.local`;
              }
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao determinar email:', error);
        // Usar fallback baseado no username
        if (profileData?.username) {
          if (profileData.username.includes('@')) {
            finalEmail = profileData.username;
          } else {
            finalEmail = `${profileData.username}@sistema.local`;
          }
        }
      }

      console.log('📋 Dados encontrados:', { 
        roles: rolesData, 
        email: finalEmail, 
        profile: profileData 
      });
      
      return {
        roles: rolesData?.map(r => r.role) || [],
        email: finalEmail,
        username: profileData?.username || 'Username não disponível'
      };
    },
    enabled: isOpen && !!userId,
    retry: 2,
    retryDelay: 1000,
  });
};
