
import { useState, useCallback } from "react";
import { type Position } from "@/utils/boardUtils";
import { useWordValidation } from "./useWordValidation";
import { useGamePointsConfig } from "./useGamePointsConfig";
import { logger } from "@/utils/logger";

interface FoundWord {
  word: string;
  positions: Position[];
  points: number;
}

interface UseSimpleSelectionWithValidationProps {
  boardData?: { board: string[][]; placedWords: any[] };
  levelWords: string[];
  foundWords: FoundWord[];
  onWordFound: (foundWord: FoundWord) => void;
}

export const useSimpleSelectionWithValidation = ({
  boardData,
  levelWords,
  foundWords,
  onWordFound
}: UseSimpleSelectionWithValidationProps) => {
  const [startCell, setStartCell] = useState<Position | null>(null);
  const [currentCell, setCurrentCell] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingWord, setIsProcessingWord] = useState(false);
  
  const { validateAndConfirmWord } = useWordValidation({
    boardData,
    levelWords,
    foundWords,
    onWordFound
  });

  // Verifica se uma posição forma linha reta com o ponto inicial
  const isValidLinearDirection = useCallback((start: Position, target: Position): boolean => {
    if (!start || !target) return false;
    
    const deltaRow = target.row - start.row;
    const deltaCol = target.col - start.col;
    
    // Mesma posição é válida
    if (deltaRow === 0 && deltaCol === 0) return true;
    
    // Horizontal (deltaRow = 0)
    if (deltaRow === 0 && deltaCol !== 0) return true;
    
    // Vertical (deltaCol = 0)
    if (deltaCol === 0 && deltaRow !== 0) return true;
    
    // Diagonal (|deltaRow| = |deltaCol|)
    if (Math.abs(deltaRow) === Math.abs(deltaCol)) return true;
    
    return false;
  }, []);

  // Inicia a seleção
  const handleStart = useCallback((row: number, col: number) => {
    if (isProcessingWord) {
      logger.debug('🚨 Ignorando handleStart - palavra sendo processada');
      return;
    }
    
    setStartCell({ row, col });
    setCurrentCell({ row, col });
    setIsDragging(true);
  }, [isProcessingWord]);

  // Atualiza célula de destino apenas se formar linha reta
  const handleDrag = useCallback((row: number, col: number) => {
    if (!isDragging || isProcessingWord || !startCell) return;
    
    const targetPosition = { row, col };
    
    // Só atualiza se formar linha reta com o ponto inicial
    if (isValidLinearDirection(startCell, targetPosition)) {
      setCurrentCell(targetPosition);
    }
  }, [isDragging, isProcessingWord, startCell, isValidLinearDirection]);

  // Finaliza e valida/confirma a palavra
  const handleEnd = useCallback(() => {
    if (isProcessingWord) {
      logger.debug('🚨 Ignorando handleEnd - palavra sendo processada');
      return;
    }

    setIsDragging(false);
    
    if (startCell && currentCell) {
      setIsProcessingWord(true);
      
      const selection = getLinearPath(startCell, currentCell);
      
      logger.debug('🎯 Processando seleção final', {
        startCell,
        currentCell,
        selectionLength: selection.length,
        isProcessing: true
      });
      
      // Tentar validar e confirmar a palavra (APENAS UMA VEZ)
      const wordConfirmed = validateAndConfirmWord(selection);
      
      if (wordConfirmed) {
        logger.info('🎉 Palavra confirmada com sucesso no handleEnd!');
      } else {
        logger.debug('❌ Palavra não confirmada no handleEnd');
      }

      // Liberar processamento após delay
      setTimeout(() => {
        setIsProcessingWord(false);
      }, 200);
    }
    
    // Limpar seleção
    setStartCell(null);
    setCurrentCell(null);
  }, [startCell, currentCell, validateAndConfirmWord, isProcessingWord]);

  // Calcula todas as posições entre start → end (linha reta: horizontal/vertical/diagonal)
  const getLinearPath = (start: Position, end: Position): Position[] => {
    if (!start || !end) return [];
    const deltaRow = end.row - start.row;
    const deltaCol = end.col - start.col;
    const stepRow = Math.sign(deltaRow);
    const stepCol = Math.sign(deltaCol);
    const length = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
    if (length === 0) return [start];
    const path: Position[] = [];
    for (let i = 0; i <= length; i++) {
      path.push({ row: start.row + stepRow * i, col: start.col + stepCol * i });
    }
    return path;
  };

  // Visual feedback: retorna true se (row,col) está na linha de seleção
  const isCellSelected = useCallback(
    (row: number, col: number) => {
      if (!startCell || !currentCell || !isDragging) return false;
      const path = getLinearPath(startCell, currentCell);
      return path.some((pos) => pos.row === row && pos.col === col);
    },
    [startCell, currentCell, isDragging]
  );

  return {
    startCell,
    currentCell,
    isDragging,
    isProcessingWord,
    handleStart,
    handleDrag,
    handleEnd,
    isCellSelected,
    getLinearPath,
  };
};
