
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DailyUserData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

export const useUserGrowth = () => {
  return useQuery({
    queryKey: ['userGrowth'],
    queryFn: async (): Promise<DailyUserData[]> => {
      console.log('📈 Buscando dados de crescimento de usuários...');

      // Buscar dados dos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: userData, error } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar dados de crescimento:', error);
        throw error;
      }

      // Agrupar por dia
      const dailyData: { [key: string]: number } = {};
      const last7Days = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
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

      console.log('📈 Dados de crescimento:', result);
      return result;
    },
    retry: 2,
    refetchInterval: 60000, // Atualizar a cada minuto
  });
};
