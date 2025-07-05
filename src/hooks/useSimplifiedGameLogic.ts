import { useState, useEffect, useCallback } from 'react';
import { useOptimizedBoard } from './useOptimizedBoard';
import { useWordValidation } from './useWordValidation';
import { useUnifiedHintSystem } from './useUnifiedHintSystem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/utils/logger';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { type Position } from '@/utils/boardUtils';
import { calculateWordPoints } from '@/utils/gameScoring';

interface FoundWord {
  word: string;
  positions: Position[];
  points: number;
}

interface UseSimplifiedGameLogicProps {
  level: number;
  timeLeft: number;
  onLevelComplete: (levelScore: number) => void;
  canRevive: boolean;
  onRevive?: () => void;
  onStopGame?: () => void;
}

export const useSimplifiedGameLogic = ({
  level,
  timeLeft,
  onLevelComplete,
  canRevive,
  onRevive,
  onStopGame
}: UseSimplifiedGameLogicProps) => {
  const { user } = useAuth();
  const { boardData, size, levelWords, isLoading, error } = useOptimizedBoard(level);

  // Estados do jogo
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [currentLevelScore, setCurrentLevelScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintHighlightedCells, setHintHighlightedCells] = useState<Position[]>([]);
  
  // Estados de seleção
  const [selectedCells, setSelectedCells] = useState<Position[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showValidWord, setShowValidWord] = useState(false);
  const [startCell, setStartCell] = useState<Position | null>(null);
  
  // Estados de modais
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  // Hook unificado para sistema de dicas (sem modal)
  const { useHint } = useUnifiedHintSystem({
    levelWords,
    foundWords,
    boardData,
    hintsUsed,
    setHintsUsed,
    setHintHighlightedCells
  });

  // 🎯 NOVA FUNÇÃO: Verificar se uma posição forma linha reta com o ponto inicial
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

  // 🎯 NOVA FUNÇÃO: Calcular caminho linear entre duas posições
  const getLinearPath = useCallback((start: Position, end: Position): Position[] => {
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
  }, []);

  // Função para adicionar palavra encontrada
  const handleWordFound = useCallback((foundWord: FoundWord) => {
    logger.info('🎯 Nova palavra encontrada!', { 
      word: foundWord.word,
      points: foundWord.points,
      positions: foundWord.positions,
      totalFoundWords: foundWords.length + 1
    }, 'SIMPLIFIED_GAME');

    setFoundWords(prev => {
      const updated = [...prev, foundWord];
      logger.debug('📝 Palavras encontradas atualizadas', { 
        totalWords: updated.length,
        words: updated.map(fw => ({ word: fw.word, positions: fw.positions }))
      }, 'SIMPLIFIED_GAME');
      return updated;
    });
    
    setCurrentLevelScore(prev => prev + foundWord.points);
    setShowValidWord(true);
    
    // Remover feedback visual após 1 segundo
    setTimeout(() => setShowValidWord(false), 1000);
  }, [foundWords.length]);

  // Configurar validação de palavras
  const { validateAndConfirmWord } = useWordValidation({
    boardData,
    levelWords,
    foundWords,
    onWordFound: handleWordFound
  });

  // Verificar game over
  useEffect(() => {
    if (timeLeft === 0 && foundWords.length < 5) {
      setShowGameOver(true);
      logger.info('Game Over - Tempo esgotado', { 
        level, 
        foundWords: foundWords.length,
        score: currentLevelScore 
      }, 'SIMPLIFIED_GAME');
    }
  }, [timeLeft, foundWords.length, level, currentLevelScore]);

  // Verificar level complete e salvar pontos UMA ÚNICA VEZ
  useEffect(() => {
    if (foundWords.length >= 5 && !showLevelComplete) {
      setShowLevelComplete(true);
      logger.info('🎉 Nível completado!', { 
        level, 
        totalScore: currentLevelScore,
        wordsFound: foundWords.length 
      }, 'SIMPLIFIED_GAME');
      
      // 🎯 SALVAR PONTOS APENAS AQUI - UMA VEZ POR SESSÃO
      saveGameSessionPoints(currentLevelScore);
      
      onLevelComplete(currentLevelScore);
    }
  }, [foundWords.length, showLevelComplete, level, currentLevelScore, onLevelComplete]);

  // 🆕 FUNÇÃO CORRIGIDA: Usar update_user_scores com melhor tratamento de erro
  const saveGameSessionPoints = useCallback(async (totalPoints: number) => {
    if (!user?.id || totalPoints === 0) {
      logger.warn('❌ Não é possível salvar pontos', { 
        userId: user?.id, 
        totalPoints,
        reason: !user?.id ? 'Usuário não autenticado' : 'Pontuação zero'
      }, 'SIMPLIFIED_GAME');
      return;
    }

    try {
      logger.info('💾 Iniciando salvamento de pontos da sessão', { 
        userId: user.id, 
        totalPoints,
        level,
        wordsFound: foundWords.length,
        timestamp: getCurrentBrasiliaTime() 
      }, 'SIMPLIFIED_GAME');

      // Usar RPC update_user_scores corrigida - incrementa partida UMA VEZ por sessão
      // XP permanente = totalPoints (1:1 ratio)
      const { data, error } = await supabase.rpc('update_user_scores', {
        p_user_id: user.id,
        p_game_points: totalPoints,
        p_experience_points: totalPoints
      });

      if (error) {
        logger.error('❌ Erro na RPC update_user_scores', { 
          error: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          },
          userId: user.id,
          totalPoints
        }, 'SIMPLIFIED_GAME');
        throw error;
      }

      if (!data || data.length === 0) {
        logger.warn('⚠️ RPC executou mas não retornou dados', { 
          userId: user.id,
          totalPoints,
          data
        }, 'SIMPLIFIED_GAME');
        return;
      }

      logger.info('✅ Pontos da sessão salvos com sucesso!', { 
        totalPoints, 
        level,
        wordsFound: foundWords.length,
        newTotalScore: data[0]?.total_score,
        newExperiencePoints: data[0]?.experience_points,
        newGamesPlayed: data[0]?.games_played,
        increment: totalPoints
      }, 'SIMPLIFIED_GAME');

      return data;
    } catch (error) {
      logger.error('❌ Erro crítico ao salvar pontos da sessão', { 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        totalPoints, 
        level,
        userId: user.id,
        timestamp: getCurrentBrasiliaTime()
      }, 'SIMPLIFIED_GAME');
      
      // Ainda assim mostrar que o nível foi completado para o usuário
      // O erro será logado mas não impedirá a progressão do jogo
    }
  }, [user?.id, level, foundWords.length]);

  // Validar palavra selecionada
  const validateSelectedWord = useCallback(async () => {
    if (selectedCells.length === 0) return;

    // Apenas validar a palavra - NÃO salvar pontos aqui
    const result = validateAndConfirmWord(selectedCells);
    
    if (result) {
      const selectedWord = selectedCells
        .map(pos => boardData.board[pos.row][pos.col])
        .join('');
      
      logger.debug('🎯 Palavra validada (pontos não salvos ainda)', { 
        word: selectedWord,
        points: calculateWordPoints(selectedWord)
      }, 'SIMPLIFIED_GAME');
    }

    // Limpar seleção
    setSelectedCells([]);
    setIsSelecting(false);
    setStartCell(null);
  }, [selectedCells, validateAndConfirmWord, boardData.board]);

  // Handlers de célula
  const handleCellMouseDown = useCallback((row: number, col: number) => {
    const position = { row, col };
    setStartCell(position);
    setSelectedCells([position]);
    setIsSelecting(true);
  }, []);

  const handleCellMouseEnter = useCallback((row: number, col: number) => {
    if (!isSelecting || !startCell) return;
    
    const targetPosition = { row, col };
    
    // Só atualiza se formar linha reta com o ponto inicial
    if (isValidLinearDirection(startCell, targetPosition)) {
      const linearPath = getLinearPath(startCell, targetPosition);
      setSelectedCells(linearPath);
    }
  }, [isSelecting, startCell, isValidLinearDirection, getLinearPath]);

  const handleCellMouseUp = useCallback(() => {
    if (isSelecting) {
      validateSelectedWord();
    }
  }, [isSelecting, validateSelectedWord]);

  // Verificar se célula está destacada por dica
  const isCellHintHighlighted = useCallback((row: number, col: number) => {
    return hintHighlightedCells.some(p => p.row === row && p.col === col);
  }, [hintHighlightedCells]);

  // Verificar se célula está selecionada
  const isCellSelected = useCallback((row: number, col: number) => {
    return selectedCells.some(p => p.row === row && p.col === col);
  }, [selectedCells]);

  // 🎯 FUNÇÃO CORRIGIDA: Verificar se célula faz parte de uma palavra encontrada
  const isCellPartOfFoundWord = useCallback((row: number, col: number) => {
    const isPartOfWord = foundWords.some(fw => 
      fw.positions.some(p => p.row === row && p.col === col)
    );
    
    // Debug detalhado para identificar problemas
    if (foundWords.length > 0) {
      logger.debug('🔍 Verificando célula para marcação', {
        cellPosition: { row, col },
        foundWordsCount: foundWords.length,
        foundWordsPositions: foundWords.map(fw => ({
          word: fw.word,
          positions: fw.positions
        })),
        isPartOfWord
      }, 'CELL_MARKING');
    }
    
    return isPartOfWord;
  }, [foundWords]);

  // 🎨 FUNÇÃO CORRIGIDA: Obter índice da palavra para colorir
  const getCellWordIndex = useCallback((row: number, col: number) => {
    for (let i = 0; i < foundWords.length; i++) {
      const word = foundWords[i];
      if (word.positions.some(p => p.row === row && p.col === col)) {
        return i;
      }
    }
    return -1;
  }, [foundWords]);

  // 🌈 FUNÇÃO CORRIGIDA: Obter cor da palavra
  const getWordColor = useCallback((wordIndex: number) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-purple-500 to-violet-600', 
      'bg-gradient-to-br from-emerald-500 to-green-600',
      'bg-gradient-to-br from-orange-500 to-amber-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-cyan-500 to-teal-600'
    ];
    
    if (wordIndex >= 0 && wordIndex < colors.length) {
      return colors[wordIndex];
    }
    
    // Cor padrão para palavras encontradas
    return 'bg-gradient-to-br from-blue-500 to-blue-600';
  }, []);

  // Actions para modais
  const closeGameOver = useCallback(() => setShowGameOver(false), []);
  const closeLevelComplete = useCallback(() => setShowLevelComplete(false), []);
  
  // 🎯 FUNÇÃO CORRIGIDA: handleGoHome agora chama onStopGame corretamente
  const handleGoHome = useCallback(() => {
    logger.info('🏠 Voltando ao menu principal - Iniciando processo', { 
      level, 
      finalScore: currentLevelScore,
      hasOnStopGame: !!onStopGame 
    }, 'SIMPLIFIED_GAME');

    try {
      if (onStopGame) {
        logger.info('🚀 Executando onStopGame callback', { 
          level, 
          finalScore: currentLevelScore 
        }, 'SIMPLIFIED_GAME');
        
        onStopGame();
        
        logger.info('✅ onStopGame executado com sucesso!', { 
          level, 
          finalScore: currentLevelScore 
        }, 'SIMPLIFIED_GAME');
      } else {
        logger.warn('⚠️ onStopGame callback não encontrado', { 
          level, 
          finalScore: currentLevelScore 
        }, 'SIMPLIFIED_GAME');
      }
    } catch (error) {
      logger.error('❌ Erro ao executar onStopGame', { 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        level, 
        finalScore: currentLevelScore 
      }, 'SIMPLIFIED_GAME');
    }
  }, [level, currentLevelScore, onStopGame]);

  return {
    // Estados do tabuleiro
    boardData,
    size,
    levelWords,
    isLoading,
    error,
    
    // Estados do jogo
    foundWords,
    currentLevelScore,
    hintsUsed,
    showValidWord,
    selectedCells,
    isSelecting,
    
    // Estados de modais (removido showHintBlockedModal)
    showGameOver,
    showLevelComplete,
    
    // Handlers de célula
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellMouseUp,
    isCellHintHighlighted,
    isCellSelected,
    isCellPartOfFoundWord,
    getCellWordIndex,
    getWordColor,
    
    // Actions
    useHint,
    closeGameOver,
    closeLevelComplete,
    handleGoHome
  };
};
