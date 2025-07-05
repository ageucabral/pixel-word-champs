
import { supabase } from '@/integrations/supabase/client';
import { WeeklyConfig } from '@/types/weeklyConfig';
import { logger } from '@/utils/logger';

export class WeeklyConfigService {
  static async loadActiveConfig(): Promise<WeeklyConfig | null> {
    const { data, error } = await supabase
      .from('weekly_config')
      .select('id, start_date, end_date, status, created_at, updated_at')
      .eq('status', 'active')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data as WeeklyConfig | null;
  }

  static async loadScheduledConfigs(): Promise<WeeklyConfig[]> {
    const { data, error } = await supabase
      .from('weekly_config')
      .select('id, start_date, end_date, status, created_at, updated_at')
      .eq('status', 'scheduled')
      .order('start_date', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []) as WeeklyConfig[];
  }

  static async loadCompletedConfigs(): Promise<WeeklyConfig[]> {
    const { data, error } = await supabase
      .from('weekly_config')
      .select('id, start_date, end_date, status, created_at, updated_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return (data || []) as WeeklyConfig[];
  }

  static async scheduleCompetition(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('weekly_config')
        .insert({
          start_date: startDate,
          end_date: endDate,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (err: any) {
      logger.error('Erro ao agendar competição:', { err }, 'WEEKLY_CONFIG_SERVICE');
      return { success: false, error: err.message };
    }
  }

  static async finalizeCompetition() {
    try {
      const { data, error } = await supabase.rpc('finalize_weekly_competition');

      if (error) throw error;

      return { success: true, data };
    } catch (err: any) {
      logger.error('Erro ao finalizar competição:', { err }, 'WEEKLY_CONFIG_SERVICE');
      return { success: false, error: err.message };
    }
  }
}
