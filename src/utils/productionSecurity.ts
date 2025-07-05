/**
 * CONFIGURAÇÃO DE SEGURANÇA PARA PRODUÇÃO (DEPRECIADO)
 * 
 * @deprecated Use src/utils/security/index.ts instead
 */

import { 
  initializeProductionSecurity, 
  getSecurityStatus,
  validateProductionConfig,
  applySecurityHeaders,
  disableDevFeatures,
  applyPerformanceConfig
} from '@/utils/security';

// Re-exportar funcionalidades para compatibilidade
export {
  initializeProductionSecurity,
  getSecurityStatus,
  validateProductionConfig,
  applySecurityHeaders,
  disableDevFeatures,
  applyPerformanceConfig
};