/**
 * Lazy Loading Components - Otimização de Bundle
 */
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component otimizado
const OptimizedLoader = () => (
  <div className="flex items-center justify-center min-h-[200px] bg-background/50 backdrop-blur-sm rounded-lg">
    <div className="flex flex-col items-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground animate-pulse">Carregando...</span>
    </div>
  </div>
);

// Loading states específicos para diferentes seções
export const AdminLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Carregando painel administrativo...</p>
    </div>
  </div>
);

export const GameLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-darker rounded-full flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 bg-white rounded-full animate-bounce"></div>
      </div>
      <p className="text-sm text-muted-foreground">Preparando o jogo...</p>
    </div>
  </div>
);

// HOC para lazy loading com suspense
const createLazyComponent = (importFn: () => Promise<any>, fallback = <OptimizedLoader />) => {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Componentes lazy carregados
export const LazyAdminPanel = createLazyComponent(
  () => import('@/pages/AdminPanel'),
  <AdminLoader />
);

export const LazyProfileScreen = createLazyComponent(
  () => import('@/components/ProfileScreen')
);

export const LazyRankingScreen = createLazyComponent(
  () => import('@/components/RankingScreen')
);

export const LazyInviteScreen = createLazyComponent(
  () => import('@/components/InviteScreen')
);

export const LazySettingsScreen = createLazyComponent(
  () => import('@/components/SettingsScreen')
);

export const LazyGameBoard = createLazyComponent(
  () => import('@/components/GameBoard'),
  <GameLoader />
);

export const LazyFullRankingScreen = createLazyComponent(
  () => import('@/components/FullRankingScreen')
);

export const LazyChallengeScreen = createLazyComponent(
  () => import('@/components/ChallengeScreen')
);

export const LazyMonthlyInviteCompetition = createLazyComponent(
  () => import('@/components/MonthlyInviteCompetition')
);

// Componentes administrativos
export const LazyAdminDashboard = createLazyComponent(
  () => import('@/components/admin/AdminDashboard'),
  <AdminLoader />
);

export const LazyAdminManagement = createLazyComponent(
  () => import('@/components/admin/AdminManagement'),
  <AdminLoader />
);

// Componentes lazy mais específicos
export const LazyGameScreens = {
  GameBoard: LazyGameBoard,
  ChallengeScreen: LazyChallengeScreen,
  FullRanking: LazyFullRankingScreen
};

export const LazyAdminScreens = {
  Dashboard: LazyAdminDashboard,
  Management: LazyAdminManagement,
  Panel: LazyAdminPanel
};

export const LazyUserScreens = {
  Profile: LazyProfileScreen,
  Ranking: LazyRankingScreen,
  Invite: LazyInviteScreen,
  Settings: LazySettingsScreen,
  MonthlyInvite: LazyMonthlyInviteCompetition
};