import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface RateLimitState {
  isLimited: boolean;
  remainingAttempts: number;
  resetTime: Date | null;
  blockedUntil: Date | null;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 15 * 60 * 1000 },
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
  game: { maxAttempts: 100, windowMs: 60 * 60 * 1000, blockDurationMs: 5 * 60 * 1000 },
  admin: { maxAttempts: 50, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 },
  general: { maxAttempts: 30, windowMs: 60 * 60 * 1000, blockDurationMs: 10 * 60 * 1000 },
};

export const useRateLimiting = (endpoint: string) => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    remainingAttempts: 0,
    resetTime: null,
    blockedUntil: null,
  });

  const checkRateLimit = useCallback(async (identifier?: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const rateLimitIdentifier = identifier || user?.id || 'anonymous';

      const { data, error } = await supabase.functions.invoke('global-rate-limiter', {
        body: {
          action: 'check',
          endpoint,
          identifier: rateLimitIdentifier,
          identifierType: user?.id ? 'user_id' : 'ip_address',
        },
      });

      if (error) {
        logger.error('Erro ao verificar rate limit', error, 'RATE_LIMITING');
        return false;
      }

      const config = defaultConfigs[endpoint] || defaultConfigs.general;
      const isLimited = data.blocked || data.attempts >= config.maxAttempts;
      
      setRateLimitState({
        isLimited,
        remainingAttempts: Math.max(0, config.maxAttempts - data.attempts),
        resetTime: data.windowStart ? new Date(Date.parse(data.windowStart) + config.windowMs) : null,
        blockedUntil: data.blockedUntil ? new Date(data.blockedUntil) : null,
      });

      return !isLimited;
    } catch (error) {
      logger.error('Erro inesperado no rate limiting', error, 'RATE_LIMITING');
      return false;
    }
  }, [endpoint]);

  const recordAttempt = useCallback(async (identifier?: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const rateLimitIdentifier = identifier || user?.id || 'anonymous';

      const { error } = await supabase.functions.invoke('global-rate-limiter', {
        body: {
          action: 'record',
          endpoint,
          identifier: rateLimitIdentifier,
          identifierType: user?.id ? 'user_id' : 'ip_address',
        },
      });

      if (error) {
        logger.error('Erro ao registrar tentativa', error, 'RATE_LIMITING');
      }
    } catch (error) {
      logger.error('Erro inesperado ao registrar tentativa', error, 'RATE_LIMITING');
    }
  }, [endpoint]);

  return {
    rateLimitState,
    checkRateLimit,
    recordAttempt,
  };
};