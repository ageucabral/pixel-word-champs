
import { useCallback } from 'react';
import { BoardGenerator } from '@/utils/boardGenerator';
import { getDefaultWordsForSize } from '@/utils/levelConfiguration';
import { type PlacedWord } from '@/utils/boardUtils';
import { logger } from '@/utils/logger';

interface BoardData {
  board: string[][];
  placedWords: PlacedWord[];
}

export const useBoardGeneration = () => {
  const generateBoard = useCallback((height: number, words: string[], level: number = 1): BoardData => {
    logger.debug('🎯 Gerando tabuleiro OTIMIZADO para nível', { 
      height, 
      level,
      wordsCount: words.length 
    }, 'BOARD_GENERATION');
    
    // Sempre gerar um tabuleiro, mesmo se não houver palavras
    if (words.length === 0) {
      logger.warn('Gerando tabuleiro com palavras padrão para nível', { height, level }, 'BOARD_GENERATION');
      const defaultWords = getDefaultWordsForSize(12); // usar largura máxima de 12
      return BoardGenerator.generateSmartBoard(height, defaultWords, level);
    }
    
    const boardData = BoardGenerator.generateSmartBoard(height, words, level);
    logger.info('✅ Tabuleiro OTIMIZADO gerado com sucesso', { 
      height, 
      level,
      wordsPlaced: boardData.placedWords.length,
      totalWords: words.length
    }, 'BOARD_GENERATION');
    
    return boardData;
  }, []);

  return { generateBoard };
};
