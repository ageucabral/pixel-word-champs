/**
 * VALIDAÇÕES DE SEGURANÇA
 */

import { productionLogger } from '@/utils/productionLogger';
import { isProduction, requiredEnvVars, allowedViteVars, activeSecurityConfig } from './core';

// Função para validar configuração de produção
export const validateProductionConfig = () => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar variáveis obrigatórias
  Object.entries(requiredEnvVars).forEach(([key, expectedValue]) => {
    const actualValue = key === 'SUPABASE_URL' ? requiredEnvVars.SUPABASE_URL : requiredEnvVars.SUPABASE_ANON_KEY;
    if (!actualValue) {
      errors.push(`Variável obrigatória ${key} não está definida`);
    }
  });

  // Verificar se há variáveis VITE_ não permitidas em produção
  if (isProduction) {
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_') && !allowedViteVars.includes(key)) {
        warnings.push(`Variável VITE_ não permitida em produção: ${key}`);
      }
    });
  }

  // Validar protocolo HTTPS em produção
  if (isProduction && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    errors.push('HTTPS é obrigatório em produção');
  }

  // Log dos resultados
  if (errors.length > 0) {
    productionLogger.error('Erros críticos de configuração detectados', { 
      errors: errors.length,
      environment: isProduction ? 'production' : 'development'
    });
    errors.forEach(error => productionLogger.error(error));
  }

  if (warnings.length > 0) {
    productionLogger.warn('Avisos de configuração', { 
      warnings: warnings.length 
    });
    warnings.forEach(warning => productionLogger.warn(warning));
  }

  if (errors.length === 0 && warnings.length === 0) {
    productionLogger.info('Configuração de segurança validada com sucesso', {
      environment: isProduction ? 'production' : 'development',
      securityLevel: isProduction ? 'high' : 'development'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: activeSecurityConfig
  };
};