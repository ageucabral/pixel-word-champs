import React, { memo, useCallback, useMemo } from 'react';
import GameBoardLayout from './game/GameBoardLayout';
import GameBoardContent from './game/GameBoardContent';
import GameBoardErrorState from './game/GameBoardErrorState';
import GameBoardLoadingState from './game/GameBoardLoadingState';
import { performanceMonitor } from '@/utils/performanceOptimizer';

interface OptimizedGameBoardProps {
  challengeId?: string;
  competitionId?: string;
  onGameComplete?: (score: number) => void;
  onBack?: () => void;
}

// Memoizar estado de loading separadamente
const MemoizedLoadingState = memo(() => {
  performanceMonitor.mark('gameboard-loading-start');
  
  return <GameBoardLoadingState level={1} />;
});

MemoizedLoadingState.displayName = 'MemoizedLoadingState';

// Memoizar estado de erro
const MemoizedErrorState = memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <GameBoardErrorState error={error} onRetry={onRetry} />
));

MemoizedErrorState.displayName = 'MemoizedErrorState';

// Hook otimizado para estado do jogo
const useOptimizedGameState = (challengeId?: string, competitionId?: string) => {
  return useMemo(() => {
    performanceMonitor.mark('gameboard-state-calculation');
    
    // Lógica de estado otimizada aqui
    const gameConfig = {
      challengeId,
      competitionId,
      // Outras configurações calculadas de forma otimizada
    };
    
    performanceMonitor.measure('gameboard-state-time', 'gameboard-state-calculation');
    
    return gameConfig;
  }, [challengeId, competitionId]);
};

const OptimizedGameBoard = memo(({
  challengeId,
  competitionId,
  onGameComplete,
  onBack
}: OptimizedGameBoardProps) => {
  performanceMonitor.mark('gameboard-render-start');
  
  // Estado otimizado
  const gameConfig = useOptimizedGameState(challengeId, competitionId);
  
  // Handlers memoizados
  const handleGameComplete = useCallback((score: number) => {
    performanceMonitor.mark('game-complete-handler');
    onGameComplete?.(score);
    performanceMonitor.measure('game-complete-time', 'game-complete-handler');
  }, [onGameComplete]);

  const handleBack = useCallback(() => {
    performanceMonitor.mark('game-back-handler');
    onBack?.();
    performanceMonitor.measure('game-back-time', 'game-back-handler');
  }, [onBack]);

  // Simular estado de loading/error para demonstração
  const isLoading = false;
  const error = null;

  performanceMonitor.measure('gameboard-render-time', 'gameboard-render-start');

  if (isLoading) {
    return <MemoizedLoadingState />;
  }

  if (error) {
    return <MemoizedErrorState error={error} onRetry={() => {}} />;
  }

  return (
    <GameBoardLayout>
      <GameBoardContent
        level={1}
        timeLeft={300}
        onTimeUp={() => {}}
        onLevelComplete={handleGameComplete}
        onAdvanceLevel={() => {}}
        onStopGame={handleBack}
        canRevive={false}
        onRevive={() => {}}
      />
    </GameBoardLayout>
  );
});

OptimizedGameBoard.displayName = 'OptimizedGameBoard';

export default OptimizedGameBoard;