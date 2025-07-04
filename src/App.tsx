import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserCardSkeleton } from '@/components/ui/SkeletonLoader';
import AuthScreen from '@/components/auth/AuthScreen';
import AuthProvider from '@/components/auth/AuthProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/utils/logger';
import { initializeCacheWarming } from '@/utils/cacheWarming';

// Lazy loading de páginas para code splitting - Fase 4
const Index = lazy(() => import('./pages/Index'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const NotFound = lazy(() => import('./pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

// Componente de loading otimizado
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
    <div className="text-center space-y-4">
      <UserCardSkeleton />
    </div>
  </div>
);

function App() {
  logger.debug('Aplicação inicializada', undefined, 'APP');

  // Inicializar cache warming automático
  useEffect(() => {
    try {
      initializeCacheWarming();
      logger.info('✅ Cache warming automático inicializado', undefined, 'APP');
    } catch (error) {
      logger.error('❌ Erro ao inicializar cache warming', { error }, 'APP');
    }
  }, []);

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <AuthProvider>
          <div className="App">
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/auth" element={<AuthScreen />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster />
          </div>
        </AuthProvider>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;