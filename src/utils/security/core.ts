/**
 * CONFIGURAÇÕES PRINCIPAIS DE SEGURANÇA
 */

import { productionLogger } from '@/utils/productionLogger';

// Detectar ambiente
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Configurações de segurança por ambiente
export const securityConfig = {
  production: {
    enableDebugLogs: false,
    enableConsoleOverride: true,
    enableCSPHeaders: true,
    enableSecurityHeaders: true,
    maxRequestSize: 1024 * 1024, // 1MB
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100, // requests per window
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    requireHttps: true,
    strictContentType: true
  },
  development: {
    enableDebugLogs: true,
    enableConsoleOverride: false,
    enableCSPHeaders: false,
    enableSecurityHeaders: false,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    rateLimitWindow: 5 * 60 * 1000, // 5 minutes
    rateLimitMax: 1000, // requests per window
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    requireHttps: false,
    strictContentType: false
  }
};

// Configuração ativa baseada no ambiente
export const activeSecurityConfig = isProduction ? securityConfig.production : securityConfig.development;

// Validação de variáveis de ambiente obrigatórias
export const requiredEnvVars = {
  SUPABASE_URL: 'https://oqzpkqbmcnpxpegshlcm.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xenBrcWJtY25weHBlZ3NobGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDY5MzcsImV4cCI6MjA2NDcyMjkzN30.Wla6j2fBOnPd0DbNmVIdhZKfkTp09d9sE8NOULcRsQk'
};

// Lista de variáveis VITE_ permitidas em produção
export const allowedViteVars = [
  'VITE_APP_ENV',
  'VITE_APP_URL',
  'VITE_DEFAULT_INVITE_CODE',
  'VITE_ENABLE_ANALYTICS',
  'VITE_ENABLE_PUSH'
];

// Status da configuração
export const getSecurityStatus = () => ({
  isProduction,
  isDevelopment,
  config: activeSecurityConfig,
  timestamp: new Date().toISOString()
});