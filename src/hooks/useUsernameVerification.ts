
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsernameCheckState {
  checking: boolean;
  available: boolean;
  exists: boolean;
}

export const useUsernameVerification = (username: string) => {
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheckState>({
    checking: false,
    available: true,
    exists: false
  });

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      // Verificação antecipada - não executar se não necessário  
      if (!username || username.length < 3) {
        setUsernameCheck({ checking: false, available: true, exists: false });
        return;
      }

      setUsernameCheck({ checking: true, available: true, exists: false });
      
      try {
        const { data, error } = await supabase.functions.invoke('check-user-availability', {
          body: { username }
        });

        if (error) throw error;

        setUsernameCheck({ 
          checking: false, 
          available: data.username_available || false,
          exists: data.username_exists || false
        });
      } catch (error) {
        console.error('Erro ao verificar username:', error);
        setUsernameCheck({ checking: false, available: true, exists: false });
      }
    };

    // Debounce maior para evitar chamadas excessivas
    const debounceTimer = setTimeout(checkUsernameAvailability, 1000);
    return () => clearTimeout(debounceTimer);
  }, [username]);

  return usernameCheck;
};
