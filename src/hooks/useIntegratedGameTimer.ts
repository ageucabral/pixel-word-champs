
import { useState, useEffect, useCallback } from 'react';
import { useGamePointsConfig } from './useGamePointsConfig';
import { supabase } from '@/integrations/supabase/client';

interface TimerConfig {
  initialTime: number;
  reviveTimeBonus: number;
}

export const useIntegratedGameTimer = (isGameStarted: boolean) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerConfig, setTimerConfig] = useState<TimerConfig>({
    initialTime: 60, // fallback alterado para 60 segundos
    reviveTimeBonus: 30 // fallback padrão de 30 segundos
  });
  const { config, loading } = useGamePointsConfig();

  // Configurar timer com base nas configurações do backend
  useEffect(() => {
    const fetchTimerConfig = async () => {
      try {
        // Buscar configuração de tempo base do banco
        const { data: timerSettings, error } = await supabase
          .from('game_settings')
          .select('setting_key, setting_value')
          .eq('setting_key', 'base_time_limit')
          .eq('category', 'gameplay');

        if (error) throw error;

        let initialTime = 60; // fallback alterado para 60 segundos
        
        // Procurar pela configuração base_time_limit
        const timerSetting = timerSettings?.find(s => s.setting_key === 'base_time_limit');
        
        if (timerSetting) {
          initialTime = parseInt(timerSetting.setting_value) || 60;
          console.log(`⏰ Tempo inicial configurado: ${initialTime} segundos (base_time_limit)`);
        } else {
          console.log('⚠️ Configuração base_time_limit não encontrada, usando padrão de 60s');
        }

        // Garantir que o revive_time_bonus tenha um valor válido
        const reviveTimeBonus = config?.revive_time_bonus || 30;
        console.log(`🔄 Revive time bonus configurado: ${reviveTimeBonus} segundos`);

        setTimerConfig({
          initialTime,
          reviveTimeBonus
        });
        setTimeRemaining(initialTime);
      } catch (error) {
        console.error('Erro ao buscar configuração de timer:', error);
        // Usar valores padrão em caso de erro
        const fallbackReviveBonus = config?.revive_time_bonus || 30;
        setTimerConfig({
          initialTime: 60, // fallback alterado para 60 segundos
          reviveTimeBonus: fallbackReviveBonus
        });
        setTimeRemaining(60); // fallback alterado para 60 segundos
      }
    };

    if (!loading) {
      fetchTimerConfig();
    }
  }, [config, loading]);

  // Reset timer when game starts
  useEffect(() => {
    if (isGameStarted) {
      setTimeRemaining(timerConfig.initialTime);
    }
  }, [isGameStarted, timerConfig.initialTime]);

  // Timer countdown
  useEffect(() => {
    if (isGameStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isGameStarted, timeRemaining]);

  const extendTime = useCallback(() => {
    const bonusTime = timerConfig.reviveTimeBonus;
    console.log(`⏰ Adicionando ${bonusTime} segundos ao tempo restante`);
    setTimeRemaining(prev => prev + bonusTime);
    return true;
  }, [timerConfig.reviveTimeBonus]);

  const resetTimer = useCallback(() => {
    setTimeRemaining(timerConfig.initialTime);
  }, [timerConfig.initialTime]);

  return {
    timeRemaining,
    extendTime,
    resetTimer,
    canRevive: true,
    timerConfig
  };
};
