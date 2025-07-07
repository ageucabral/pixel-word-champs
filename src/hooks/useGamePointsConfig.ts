
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface PointsConfig {
  [key: string]: number;
}

export const useGamePointsConfig = () => {
  const [config, setConfig] = useState<PointsConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('game_settings')
          .select('setting_key, setting_value')
          .eq('category', 'scoring');

        if (error) throw error;

        const configObj = data.reduce((acc, setting) => {
          acc[setting.setting_key] = parseInt(setting.setting_value);
          return acc;
        }, {} as PointsConfig);

        logger.log('🎯 Configurações de pontuação carregadas:', configObj);
        setConfig(configObj);
      } catch (error) {
        logger.error('Erro ao carregar configurações de pontos:', error);
        // Valores padrão em caso de erro (conforme Opção A)
        setConfig({
          'points_per_3_to_5_letter_word': 1,
          'points_per_6_to_8_letter_word': 2,
          'points_per_8_to_10_letter_word': 3,
          'points_per_11_to_20_letter_word': 6
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);


  return {
    config,
    loading
  };
};
