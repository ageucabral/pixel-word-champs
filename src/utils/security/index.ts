/**
 * SISTEMA DE SEGURANÇA REFATORADO
 * 
 * Sistema modular de validação e hardening para ambiente de produção
 */

import { productionLogger } from '@/utils/productionLogger';
import { validateProductionConfig } from './validation';
import { applySecurityHeaders } from './headers';
import { disableDevFeatures, applyPerformanceConfig } from './features';
import { isProduction, getSecurityStatus } from './core';

// Função principal de inicialização da segurança
export const initializeProductionSecurity = () => {
  try {
    productionLogger.info('Inicializando configurações de segurança de produção');

    const validation = validateProductionConfig();
    
    if (!validation.isValid) {
      productionLogger.error('Configuração de produção inválida - aplicação pode estar insegura');
      return false;
    }

    applySecurityHeaders();
    disableDevFeatures();
    applyPerformanceConfig();

    productionLogger.info('Configurações de segurança de produção aplicadas com sucesso', {
      environment: isProduction ? 'production' : 'development',
      timestamp: new Date().toISOString()
    });

    return true;

  } catch (error: any) {
    productionLogger.error('Erro ao inicializar segurança de produção', { 
      error: error.message 
    });
    return false;
  }
};

// Exportar funcionalidades principais
export { getSecurityStatus } from './core';
export { validateProductionConfig } from './validation';
export { applySecurityHeaders } from './headers';
export { disableDevFeatures, applyPerformanceConfig } from './features';