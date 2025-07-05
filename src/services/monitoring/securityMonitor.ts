/**
 * SERVIÇO OTIMIZADO DE MONITORAMENTO DE SEGURANÇA
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface SecurityEvent {
  id?: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
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

export interface TimeframeOptions {
  '1h': number;
  '24h': number;
  '7d': number;
}

const TIMEFRAME_HOURS: TimeframeOptions = {
  '1h': 1,
  '24h': 24,
  '7d': 168
};

export class SecurityMonitoringService {
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<SecurityEvent | null> {
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
      return data as SecurityEvent;
    } catch (error) {
      logger.error('Erro inesperado ao registrar evento de segurança', error, 'SECURITY_MONITORING');
      return null;
    }
  }

  async getSecurityMetrics(timeframe: keyof TimeframeOptions = '24h'): Promise<SecurityMetrics | null> {
    try {
      const hoursAgo = TIMEFRAME_HOURS[timeframe];
      const timeAgo = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      const { data: events, error } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', timeAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erro ao buscar métricas de segurança', error, 'SECURITY_MONITORING');
        return null;
      }

      return this.processMetrics((events || []) as SecurityEvent[]);
    } catch (error) {
      logger.error('Erro inesperado ao buscar métricas de segurança', error, 'SECURITY_MONITORING');
      return null;
    }
  }

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

  private processMetrics(events: SecurityEvent[]): SecurityMetrics {
    const totalEvents = events.length;
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const recentEvents = events.slice(0, 10);

    const eventsByType = events.reduce((acc: Record<string, number>, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    const eventsBySeverity = events.reduce((acc: Record<string, number>, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEvents,
      criticalEvents,
      recentEvents,
      eventsByType,
      eventsBySeverity,
    };
  }
}

export const securityMonitoring = new SecurityMonitoringService();