
import { useState, useCallback } from 'react';
import { useGameSessionManager } from './useGameSessionManager';
import { logger } from '@/utils/logger';

interface FoundWord {
  word: string;
  positions: Array<{row: number, col: number}>;
  points: number;
}

export const useOptimizedGameScoring = (level: number, boardData: any) => {
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const { startNewSession, addWordFound, completeSession, resetSession } = useGameSessionManager();
  
  // ETAPA 4: Constante para total de palavras necessárias
  const TOTAL_WORDS_REQUIRED = 5;

  // Inicializar sessão no banco
  const initializeSession = useCallback(async () => {
    try {
      const session = await startNewSession(level, boardData);
      setCurrentSession(session);
      logger.info('🎮 Sessão inicializada no banco', { sessionId: session?.sessionId });
    } catch (error) {
      logger.error('❌ Erro ao inicializar sessão', { error });
    }
  }, [level, boardData, startNewSession]);

  // Calcular dados do nível atual baseado nas palavras encontradas
  const calculateLevelData = useCallback((foundWords: FoundWord[]) => {
    const currentLevelScore = foundWords.reduce((sum, fw) => sum + fw.points, 0);
    const isLevelCompleted = foundWords.length >= TOTAL_WORDS_REQUIRED;

    return { currentLevelScore, isLevelCompleted };
  }, []);

  const registerLevelCompletion = useCallback(async (foundWords: FoundWord[], timeElapsed: number) => {
    if (isUpdatingScore) {
      logger.warn('⚠️ Já está registrando conclusão, ignorando nova tentativa');
      return;
    }

    const { currentLevelScore, isLevelCompleted } = calculateLevelData(foundWords);

    // VALIDAÇÃO RIGOROSA: Verificar múltiplas condições antes de prosseguir
    if (!isLevelCompleted || foundWords.length < TOTAL_WORDS_REQUIRED) {
      logger.error(`❌ VALIDAÇÃO FALHOU: Apenas ${foundWords.length} de ${TOTAL_WORDS_REQUIRED} palavras encontradas`);
      await resetSession();
      throw new Error(`Sessão inválida: ${foundWords.length} palavras encontradas (mínimo: ${TOTAL_WORDS_REQUIRED})`);
    }

    if (currentLevelScore <= 0) {
      logger.error('❌ VALIDAÇÃO FALHOU: Pontuação zero ou negativa');
      await resetSession();
      throw new Error('Sessão inválida: pontuação deve ser maior que zero');
    }

    setIsUpdatingScore(true);
    
    try {
      logger.info(`🔄 Registrando conclusão VALIDADA do nível ${level}: ${foundWords.length} palavras, ${currentLevelScore} pontos`);

      // Registrar sessão COMPLETADA no banco com validações rigorosas
      const session = await completeSession(timeElapsed);

      if (session) {
        logger.info(`✅ Nível ${level} completado e registrado: ${currentLevelScore} pontos, ${foundWords.length} palavras`);
      } else {
        throw new Error('Falha ao registrar sessão no banco de dados');
      }

    } catch (error) {
      logger.error('❌ Erro crítico ao registrar conclusão do nível:', error);
      // Em caso de erro, garantir que a sessão seja descartada
      await resetSession();
      throw error;
    } finally {
      setIsUpdatingScore(false);
    }
  }, [level, isUpdatingScore, calculateLevelData, completeSession, resetSession]);

  const discardIncompleteLevel = useCallback(async () => {
    logger.info(`🗑️ Descartando nível ${level} incompleto - sessão não será salva`);
    await resetSession();
  }, [level, resetSession]);

  return {
    TOTAL_WORDS_REQUIRED,
    calculateLevelData,
    registerLevelCompletion,
    discardIncompleteLevel,
    initializeSession,
    isUpdatingScore
  };
};
