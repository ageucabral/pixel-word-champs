
import { useCallback } from 'react';
import { type Position } from '@/utils/boardUtils';
import { logger } from '@/utils/logger';
import { useGameScoring } from '@/contexts/GameScoringContext';

interface FoundWord {
  word: string;
  positions: Position[];
  points: number;
}

interface UseUnifiedHintSystemProps {
  levelWords: string[];
  foundWords: FoundWord[];
  boardData: { board: string[][]; placedWords: any[] };
  hintsUsed: number;
  setHintsUsed: (value: number | ((prev: number) => number)) => void;
  setHintHighlightedCells: (positions: Position[]) => void;
}

export const useUnifiedHintSystem = ({
  levelWords,
  foundWords,
  boardData,
  hintsUsed,
  setHintsUsed,
  setHintHighlightedCells
}: UseUnifiedHintSystemProps) => {
  const { calculateWordPoints } = useGameScoring();

  // Função principal para usar dica - TODAS as palavras podem receber dica
  const useHint = useCallback(() => {
    // Validação 1: Verificar se ainda há dicas disponíveis
    if (hintsUsed >= 1) {
      logger.warn('Tentativa de usar dica quando não há mais disponíveis', {
        hintsUsed,
        maxHints: 1
      }, 'UNIFIED_HINT_SYSTEM');
      return false;
    }

    const foundWordTexts = foundWords.map(fw => fw.word);
    
    // Encontrar palavras disponíveis para dica (qualquer palavra não encontrada)
    const availableWordsForHint = levelWords.filter(word => 
      !foundWordTexts.includes(word)
    );

    // Validação 2: Verificar se há palavras disponíveis para dica
    if (availableWordsForHint.length === 0) {
      logger.info('Nenhuma palavra disponível para dica (todas foram encontradas)', {
        totalWords: levelWords.length,
        foundWords: foundWords.length
      }, 'UNIFIED_HINT_SYSTEM');
      return false;
    }

    // Escolher a palavra mais fácil (menor pontuação/tamanho)
    const sortedAvailableWords = availableWordsForHint.sort((a, b) => {
      const pointsA = calculateWordPoints(a);
      const pointsB = calculateWordPoints(b);
      
      // Priorizar por menor pontuação, depois por menor tamanho
      if (pointsA !== pointsB) return pointsA - pointsB;
      return a.length - b.length;
    });

    const hintWord = sortedAvailableWords[0];

    // Encontrar posições da palavra no tabuleiro
    const wordPlacement = boardData.placedWords.find(pw => pw.word === hintWord);
    
    if (!wordPlacement || !Array.isArray(wordPlacement.positions)) {
      logger.error('Palavra para dica não encontrada no tabuleiro', {
        hintWord,
        availablePlacements: boardData.placedWords.map(pw => pw.word)
      }, 'UNIFIED_HINT_SYSTEM');
      return false;
    }

    // Aplicar dica com sucesso
    setHintsUsed(prev => prev + 1);
    setHintHighlightedCells(wordPlacement.positions);
    
    logger.info('Dica aplicada com sucesso', {
      hintWord,
      positions: wordPlacement.positions,
      hintsUsedAfter: hintsUsed + 1,
      availableWordsCount: availableWordsForHint.length
    }, 'UNIFIED_HINT_SYSTEM');

    // Remover destaque após 3 segundos
    setTimeout(() => {
      setHintHighlightedCells([]);
    }, 3000);

    return true;
  }, [
    hintsUsed,
    foundWords,
    levelWords,
    boardData.placedWords,
    setHintsUsed,
    setHintHighlightedCells,
    calculateWordPoints
  ]);

  return {
    useHint
  };
};
