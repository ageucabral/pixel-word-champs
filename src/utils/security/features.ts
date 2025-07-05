/**
 * CONFIGURAÇÕES DE RECURSOS E PERFORMANCE
 */

import { productionLogger } from '@/utils/productionLogger';
import { isProduction } from './core';

// Função para desabilitar recursos de desenvolvimento em produção
export const disableDevFeatures = () => {
  if (!isProduction) return;

  if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = undefined;
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = undefined;
  }

  // Limpar variáveis de desenvolvimento
  delete (window as any).__DEV__;
  delete (window as any).__DEVELOPMENT__;

  productionLogger.info('Recursos de desenvolvimento desabilitados');
};

// Função para aplicar configurações de performance
export const applyPerformanceConfig = () => {
  if (!isProduction) return;

  // Configurar Service Worker para cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => productionLogger.info('Service Worker registrado'))
      .catch(() => productionLogger.warn('Falha ao registrar Service Worker'));
  }

  // Configurar preload crítico
  const criticalResources = [
    '/src/main.tsx',
    '/src/index.css'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
  });

  productionLogger.info('Configurações de performance aplicadas');
};