
import { useState, useEffect } from 'react';
import { useBoardGeneration } from './useBoardGeneration';
import { useSimpleWordSelection } from './useSimpleWordSelection';
import { getBoardSize, getMobileBoardSize, type PlacedWord } from '@/utils/boardUtils';
import { useIsMobile } from './use-mobile';
import { logger } from '@/utils/logger';

interface BoardData {
  board: string[][];
  placedWords: PlacedWord[];
}

interface OptimizedBoardResult {
  boardData: BoardData;
  size: number;
  levelWords: string[];
  isLoading: boolean;
  error: string | null;
  isWordSelectionError: boolean;
}

export const useOptimizedBoard = (level: number): OptimizedBoardResult => {
  const [boardData, setBoardData] = useState<BoardData>({ board: [], placedWords: [] });
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // ETAPA 4: Usar seleção simples com foco em 5 palavras para o jogo
  const { levelWords, isLoading: wordsLoading, error: wordsError } = useSimpleWordSelection(level);
  const { generateBoard } = useBoardGeneration();

  const size = isMobile ? getMobileBoardSize(level) : getBoardSize(level);

  useEffect(() => {
    if (wordsLoading || levelWords.length === 0) return;

    logger.info('🏗️ Gerando tabuleiro otimizado (ETAPA 4)', {
      level,
      isMobile,
      size,
      wordsCount: levelWords.length,
      targetWordsForGame: 5, // Sempre focado em 5 palavras para o jogo
      words: levelWords
    }, 'OPTIMIZED_BOARD');

    try {
      // ✨ NOVO: Passar nível para geração baseada em estratégia
      const newBoardData = generateBoard(size, levelWords, level);
      setBoardData(newBoardData);
      setError(null);
      
      logger.info('✅ Tabuleiro NIVEL-ESPECÍFICO gerado (ETAPA 5)', {
        level,
        placedWords: newBoardData.placedWords.length,
        totalWords: levelWords.length,
        gameTargetWords: 5, // Jogo sempre busca 5 palavras
        levelStrategy: `Nível ${level} com estratégia específica`
      }, 'OPTIMIZED_BOARD');
      
    } catch (err) {
      logger.error('❌ Erro ao gerar tabuleiro nivel-específico', { err, level }, 'OPTIMIZED_BOARD');
      setError(err instanceof Error ? err.message : 'Erro na geração do tabuleiro');
    }
  }, [levelWords, wordsLoading, level, size, isMobile, generateBoard]);

  // Combinar erros de palavras e tabuleiro
  const combinedError = wordsError || error;
  const isWordSelectionError = !!wordsError;

  return {
    boardData,
    size,
    levelWords,
    isLoading: wordsLoading,
    error: combinedError,
    isWordSelectionError
  };
};
