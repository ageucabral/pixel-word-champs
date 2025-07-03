import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface SecurityEvent {
  id?: string;
  event_type: string;
  severity: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  created_at?: string;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  recentEvents: SecurityEvent[];
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
}

export const securityMonitoring = {
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .insert({
          event_type: event.event_type,
          severity: event.severity,
          user_id: event.user_id,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          details: event.details,
        })
        .select()
        .single();

      if (error) {
        logger.error('Erro ao registrar evento de segurança', error, 'SECURITY_MONITORING');
        return null;
      }

      logger.info('Evento de segurança registrado', { eventId: data.id, type: event.event_type }, 'SECURITY_MONITORING');
      return data;
    } catch (error) {
      logger.error('Erro inesperado ao registrar evento de segurança', error, 'SECURITY_MONITORING');
      return null;
    }
  },

  async getSecurityMetrics(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<SecurityMetrics | null> {
    try {
      const timeAgo = new Date();
      switch (timeframe) {
        case '1h':
          timeAgo.setHours(timeAgo.getHours() - 1);
          break;
        case '24h':
          timeAgo.setDate(timeAgo.getDate() - 1);
          break;
        case '7d':
          timeAgo.setDate(timeAgo.getDate() - 7);
          break;
      }

      const { data: events, error } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', timeAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erro ao buscar métricas de segurança', error, 'SECURITY_MONITORING');
        return null;
      }

      const totalEvents = events?.length || 0;
      const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0;
      const recentEvents = events?.slice(0, 10) || [];

      const eventsByType = events?.reduce((acc: Record<string, number>, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const eventsBySeverity = events?.reduce((acc: Record<string, number>, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        totalEvents,
        criticalEvents,
        recentEvents: recentEvents as SecurityEvent[],
        eventsByType,
        eventsBySeverity,
      };
    } catch (error) {
      logger.error('Erro inesperado ao buscar métricas de segurança', error, 'SECURITY_MONITORING');
      return null;
    }
  },

  async getRecentAlerts(limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .in('severity', ['high', 'critical'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Erro ao buscar alertas recentes', error, 'SECURITY_MONITORING');
        return [];
      }

      return (data as SecurityEvent[]) || [];
    } catch (error) {
      logger.error('Erro inesperado ao buscar alertas recentes', error, 'SECURITY_MONITORING');
      return [];
    }
  }
};