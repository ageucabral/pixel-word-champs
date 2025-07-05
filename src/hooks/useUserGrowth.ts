
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentBrasiliaDate, createBrasiliaTimestamp } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface DailyUserData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

export const useUserGrowth = () => {
  return useQuery({
    queryKey: ['userGrowth'],
    queryFn: async (): Promise<DailyUserData[]> => {
      logger.info('📈 Buscando dados de crescimento de usuários...', {}, 'USE_USER_GROWTH');

      // Buscar dados dos últimos 7 dias usando horário de Brasília
      const sevenDaysAgo = getCurrentBrasiliaDate();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: userData, error } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', createBrasiliaTimestamp(sevenDaysAgo.toString()))
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('❌ Erro ao buscar dados de crescimento:', { error }, 'USE_USER_GROWTH');
        throw error;
      }

      // Agrupar por dia
      const dailyData: { [key: string]: number } = {};
      const last7Days = [];

      // Gerar últimos 7 dias usando horário de Brasília
      for (let i = 6; i >= 0; i--) {
        const date = getCurrentBrasiliaDate();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        dailyData[dateStr] = 0;
      }

      userData?.forEach(user => {
        const dateStr = user.created_at.split('T')[0];
        if (dailyData.hasOwnProperty(dateStr)) {
          dailyData[dateStr]++;
        }
      });

      // Calcular total cumulativo
      let totalUsers = 0;
      const result = last7Days.map(date => {
        totalUsers += dailyData[date];
        return {
          date,
          newUsers: dailyData[date],
          totalUsers
        };
      });

      logger.debug('📈 Dados de crescimento:', result, 'USE_USER_GROWTH');
      return result;
    },
    retry: 2,
    refetchInterval: 60000, // Atualizar a cada minuto
  });
};
