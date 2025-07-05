/**
 * CONFIGURAÇÃO DE HEADERS DE SEGURANÇA
 */

import { productionLogger } from '@/utils/productionLogger';
import { activeSecurityConfig } from './core';

// Função para aplicar headers de segurança
export const applySecurityHeaders = () => {
  if (!activeSecurityConfig.enableSecurityHeaders) return;

  // CSP Headers (Content Security Policy)
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://oqzpkqbmcnpxpegshlcm.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://oqzpkqbmcnpxpegshlcm.supabase.co wss://oqzpkqbmcnpxpegshlcm.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  // Adicionar meta tag CSP se não existir
  if (activeSecurityConfig.enableCSPHeaders && !document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = cspPolicy;
    document.head.appendChild(cspMeta);
    
    productionLogger.info('Headers de segurança CSP aplicados');
  }

  // Adicionar outros headers de segurança via meta tags
  const securityHeaders = [
    { name: 'X-Content-Type-Options', content: 'nosniff' },
    { name: 'X-Frame-Options', content: 'DENY' },
    { name: 'X-XSS-Protection', content: '1; mode=block' },
    { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
  ];

  securityHeaders.forEach(header => {
    const existing = document.querySelector(`meta[name="${header.name}"]`);
    if (!existing) {
      const meta = document.createElement('meta');
      meta.name = header.name;
      meta.content = header.content;
      document.head.appendChild(meta);
    }
  });
};