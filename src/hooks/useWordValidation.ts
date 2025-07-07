
import { useCallback, useRef } from 'react';
import { type Position } from '@/utils/boardUtils';
import { isLinearPath } from '@/hooks/word-selection/validateLinearPath';
import { logger } from '@/utils/logger';
import { useGameScoring } from '@/contexts/GameScoringContext';

interface FoundWord {
  word: string;
  positions: Position[];
  points: number;
}

interface UseWordValidationProps {
  boardData?: { board: string[][]; placedWords: any[] };
  levelWords: string[];
  foundWords: FoundWord[];
  onWordFound: (foundWord: FoundWord) => void;
}

export const useWordValidation = ({
  boardData,
  levelWords,
  foundWords,
  onWordFound
}: UseWordValidationProps) => {
  const { calculateWordPoints } = useGameScoring();

  // ✅ PROTEÇÃO ROBUSTA: Lock com timeout
  const isExecutingRef = useRef(false);
  const lastExecutionRef = useRef(0);

  const validateAndConfirmWord = useCallback((selectedPositions: Position[]) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutionRef.current;
    
    // ✅ DEBOUNCE: Não executar se foi chamado recentemente (< 200ms)
    if (timeSinceLastExecution < 200) {
      logger.debug('🚫 Validação ignorada - debounce ativo', {
        timeSinceLastExecution,
        positions: selectedPositions
      }, 'WORD_VALIDATION');
      return false;
    }

    // ✅ PROTEÇÃO CRÍTICA: Verificar se já está executando
    if (isExecutingRef.current) {
      logger.warn('🚨 DUPLICAÇÃO EVITADA - validateAndConfirmWord já está executando', {
        positions: selectedPositions,
        timeSinceLastExecution
      }, 'WORD_VALIDATION');
      return false;
    }

    // Marcar como executando
    isExecutingRef.current = true;
    lastExecutionRef.current = now;

    try {
      // Validação 1: Verificar se há posições selecionadas
      if (!selectedPositions || selectedPositions.length < 2) {
        logger.debug('Seleção muito pequena para formar uma palavra', { 
          positionsCount: selectedPositions?.length || 0 
        });
        return false;
      }

      // Validação 2: Verificar se a trajetória é linear
      if (!isLinearPath(selectedPositions)) {
        logger.debug('Trajetória de seleção inválida - não é linear', { 
          positions: selectedPositions 
        });
        return false;
      }

      // Validação 3: Verificar se temos dados do tabuleiro
      if (!boardData?.board) {
        logger.warn('Dados do tabuleiro não disponíveis para validação');
        return false;
      }

      // Extrair a palavra das posições selecionadas (direção normal)
      const normalWord = selectedPositions.map(pos => {
        if (pos.row >= 0 && pos.row < boardData.board.length && 
            pos.col >= 0 && pos.col < boardData.board[pos.row].length) {
          return boardData.board[pos.row][pos.col];
        }
        return '';
      }).join('');

      // 🆕 NOVA FUNCIONALIDADE: Extrair palavra na direção reversa
      const reverseWord = selectedPositions.slice().reverse().map(pos => {
        if (pos.row >= 0 && pos.row < boardData.board.length && 
            pos.col >= 0 && pos.col < boardData.board[pos.row].length) {
          return boardData.board[pos.row][pos.col];
        }
        return '';
      }).join('');

      logger.debug('Palavras extraídas da seleção', { 
        normalWord, 
        reverseWord,
        positions: selectedPositions,
        wordLength: normalWord.length 
      });

      // Validação 4: Verificar se alguma das palavras (normal ou reversa) é válida
      let validWord = '';
      let validPositions = selectedPositions;

      if (levelWords.includes(normalWord)) {
        validWord = normalWord;
        validPositions = selectedPositions;
        logger.debug('Palavra válida encontrada (direção normal)', { word: normalWord });
      } else if (levelWords.includes(reverseWord)) {
        validWord = reverseWord;
        validPositions = selectedPositions.slice().reverse();
        logger.debug('Palavra válida encontrada (direção reversa)', { word: reverseWord });
      } else {
        logger.debug('Nenhuma palavra válida encontrada', { 
          normalWord, 
          reverseWord,
          availableWordsCount: levelWords.length
        });
        return false;
      }

      // Validação 5: PROTEÇÃO CRÍTICA - Verificar duplicação
      const alreadyFound = foundWords.some(fw => fw.word === validWord);
      if (alreadyFound) {
        logger.warn('🚨 DUPLICAÇÃO EVITADA - Palavra já encontrada', { 
          word: validWord,
          existingWordsCount: foundWords.length
        });
        return false;
      }

      // ✅ PALAVRA VÁLIDA: Processar uma única vez
      const points = calculateWordPoints(validWord);
      const foundWord: FoundWord = {
        word: validWord,
        positions: validPositions,
        points
      };

      const wordId = `${validWord}-${now}`;
      
      logger.info('✅ PALAVRA VÁLIDA CONFIRMADA (BIDIRECIONAL) - PROCESSANDO UMA ÚNICA VEZ', { 
        wordId,
        word: validWord,
        direction: validWord === normalWord ? 'normal' : 'reversa',
        points, 
        positionsCount: validPositions.length,
        beforeFoundWordsCount: foundWords.length
      });

      // ✅ CRÍTICO: Chamar callback para adicionar ao estado APENAS UMA VEZ
      onWordFound(foundWord);
      
      logger.info('📝 onWordFound executado com sucesso (bidirecional)', {
        wordId,
        word: validWord,
        points
      });

      return true;

    } finally {
      // ✅ LIBERAÇÃO COM DELAY: Evitar chamadas múltiplas rapidamente
      setTimeout(() => {
        isExecutingRef.current = false;
        logger.debug('🔓 Lock de validação liberado', {
          word: selectedPositions.length > 0 ? 'processada' : 'vazia'
        });
      }, 300); // Delay maior para proteção adicional
    }

  }, [boardData, levelWords, foundWords, onWordFound]);

  return {
    validateAndConfirmWord
  };
};
