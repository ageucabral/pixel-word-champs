
import { supabase } from '@/integrations/supabase/client';

export const rankingService = {
  async updateDailyRanking(): Promise<void> {
    try {
      console.log('🔄 Atualizando ranking diário...');
      
      const { error } = await supabase.rpc('update_daily_ranking');
      
      if (error) {
        console.error('❌ Erro ao atualizar ranking diário:', error);
        throw error;
      }
      
      console.log('✅ Ranking diário atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro na atualização do ranking diário:', error);
      throw error;
    }
  },

  async updateWeeklyRanking(): Promise<void> {
    try {
      console.log('🔄 Atualizando ranking semanal...');
      
      const { error } = await supabase.rpc('update_weekly_ranking');
      
      if (error) {
        console.error('❌ Erro ao atualizar ranking semanal:', error);
        throw error;
      }
      
      console.log('✅ Ranking semanal atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro na atualização do ranking semanal:', error);
      throw error;
    }
  },

  async getTotalParticipants(type: 'daily' | 'weekly'): Promise<number> {
    try {
      const table = type === 'daily' ? 'daily_rankings' : 'weekly_rankings';
      
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      
      if (type === 'daily') {
        query = query.eq('date', new Date().toISOString().split('T')[0]);
      } else {
        // Para semanal, buscar da semana atual
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(today.setDate(diff));
        const weekStartStr = weekStart.toISOString().split('T')[0];
        
        query = query.eq('week_start', weekStartStr);
      }

      const { count, error } = await query;

      if (error) {
        console.error(`❌ Erro ao contar participantes ${type}:`, error);
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error(`❌ Erro ao obter total de participantes ${type}:`, error);
      return 0;
    }
  }
};
