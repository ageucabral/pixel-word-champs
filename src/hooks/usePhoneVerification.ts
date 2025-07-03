
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneBR } from '@/utils/emailPhoneDetection';
import { logger } from '@/utils/logger';

interface PhoneCheckState {
  checking: boolean;
  available: boolean;
  exists: boolean;
}

export const usePhoneVerification = (phone: string, currentUserPhone?: string) => {
  const [phoneCheck, setPhoneCheck] = useState<PhoneCheckState>({
    checking: false,
    available: true,
    exists: false
  });

  useEffect(() => {
    const checkPhoneAvailability = async () => {
      if (!phone || phone.length < 10) {
        setPhoneCheck({ checking: false, available: true, exists: false });
        return;
      }

      // Formatar telefone corretamente com +55
      const formattedPhone = formatPhoneBR(phone);
      const formattedCurrentPhone = currentUserPhone ? formatPhoneBR(currentUserPhone) : '';
      
      // Se é o mesmo telefone do usuário atual, considerar disponível
      if (formattedPhone === formattedCurrentPhone) {
        setPhoneCheck({ checking: false, available: true, exists: false });
        return;
      }

      setPhoneCheck({ checking: true, available: true, exists: false });
      
      try {
        // Buscar diretamente na tabela profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (error) {
          logger.error('Erro ao verificar disponibilidade do telefone', { error: error.message });
          setPhoneCheck({ checking: false, available: true, exists: false });
        } else {
          const phoneExists = !!data;
          setPhoneCheck({ 
            checking: false, 
            available: !phoneExists,
            exists: phoneExists
          });
        }
      } catch (error) {
        logger.error('Erro na verificação de telefone', { error });
        setPhoneCheck({ checking: false, available: true, exists: false });
      }
    };

    const debounceTimer = setTimeout(checkPhoneAvailability, 500);
    return () => clearTimeout(debounceTimer);
  }, [phone, currentUserPhone]);

  return phoneCheck;
};
