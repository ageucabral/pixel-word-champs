
/**
 * Constantes globais da aplicação
 */

export const APP_CONFIG = {
  NAME: 'Caça Palavras Royale',
  DESCRIPTION: 'Desafie sua mente, conquiste palavras',
  VERSION: '1.0.0'
} as const;

export const TIMING_CONFIG = {
  COMPETITION_REFRESH_INTERVAL: 30 * 60 * 1000, // 30 minutos
  RANKING_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutos
  DEFAULT_TIMEOUT: 3000 // 3 segundos
} as const;

export const UI_CONFIG = {
  MAX_COMPETITION_DISPLAY: 100,
  DEFAULT_PAGE_SIZE: 20,
  MOBILE_BREAKPOINT: 768
} as const;

export const COMPETITION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SCHEDULED: 'scheduled'
} as const;

export const COMPETITION_TYPES = {
  CHALLENGE: 'challenge',
  TOURNAMENT: 'tournament'
} as const;
