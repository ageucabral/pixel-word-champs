
import { useState, useEffect } from 'react';
import { type Position } from '@/utils/boardUtils';
import { useGamePointsConfig } from './useGamePointsConfig';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface FoundWord {
  word: string;
  positions: Position[];
  points: number;
}

export const useGameLogic = (
  level: number,
  timeLeft: number,
  levelWords: string[],
  onWordFound: (word: string, points: number) => void,
  onLevelComplete: (levelScore: number) => void
) => {
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [permanentlyMarkedCells, setPermanentlyMarkedCells] = useState<Position[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [hintHighlightedCells, setHintHighlightedCells] = useState<Position[]>([]);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  
  const { getPointsForWord } = useGamePointsConfig();

  // ETAPA 3: Sempre verificar se completou 5 palavras para level complete
  const TOTAL_WORDS = 5;

  // Reset state when level changes
  useEffect(() => {
    logger.info(`🔄 Resetando estado do jogo para nível ${level}`, { level }, 'GAME_LOGIC');
    setFoundWords([]);
    setPermanentlyMarkedCells([]);
    setHintsUsed(0);
    setShowLevelComplete(false);
    setShowGameOver(false);
    setHintHighlightedCells([]);
    setIsLevelCompleted(false);
  }, [level]);

  // Detecta quando o tempo acaba
  useEffect(() => {
    if (timeLeft === 0 && !showGameOver && !isLevelCompleted) {
      logger.info('⏰ Tempo esgotado - Game Over', { level, foundWords: foundWords.length }, 'GAME_LOGIC');
      setShowGameOver(true);
    }
  }, [timeLeft, showGameOver, isLevelCompleted]);

  // ETAPA 3: Lógica corrigida - verificar se completou 5 palavras
  useEffect(() => {
    if (foundWords.length === TOTAL_WORDS && !showLevelComplete && !isLevelCompleted) {
      const levelScore = foundWords.reduce((sum, fw) => sum + fw.points, 0);
      
      logger.info(`🎉 Nível ${level} COMPLETADO! Score: ${levelScore}`, {
        level,
        foundWordsCount: foundWords.length,
        totalWordsRequired: TOTAL_WORDS,
        foundWords: foundWords.map(fw => fw.word),
        levelScore
      }, 'GAME_LOGIC');
      
      setShowLevelComplete(true);
      setIsLevelCompleted(true);
      
      // Registra pontos no banco de dados quando completa o nível
      updateUserScore(levelScore);
      onLevelComplete(levelScore);
    }
  }, [foundWords.length, showLevelComplete, foundWords, onLevelComplete, level, isLevelCompleted]);

  const updateUserScore = async (points: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('⚠️ Usuário não autenticado, não é possível atualizar pontuação');
        return;
      }

      logger.info(`🔄 Registrando pontuação do nível completado para usuário ${user.id}: +${points} pontos`);

      // Buscar pontuação atual do usuário
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_score, games_played')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        logger.error('❌ Erro ao buscar perfil:', fetchError);
        return;
      }

      const currentScore = profile?.total_score || 0;
      const newScore = currentScore + points;

      // Atualizar pontuação no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          total_score: newScore,
          games_played: (profile?.games_played || 0) + 1
        })
        .eq('id', user.id);

      if (updateError) {
        logger.error('❌ Erro ao atualizar pontuação:', updateError);
        throw updateError;
      }

      logger.info(`✅ Pontuação do nível completado registrada: ${currentScore} → ${newScore} (+${points})`);

      // Forçar atualização do ranking semanal
      try {
        const { error: rankingError } = await supabase.rpc('update_weekly_ranking');
        if (rankingError) {
          logger.warn('⚠️ Erro ao atualizar ranking semanal:', rankingError);
        } else {
          logger.info('✅ Ranking semanal atualizado após completar nível');
        }
      } catch (rankingUpdateError) {
        logger.warn('⚠️ Erro ao forçar atualização do ranking:', rankingUpdateError);
      }

    } catch (error) {
      logger.error('❌ Erro ao atualizar pontuação do usuário:', error);
    }
  };

  const addFoundWord = async (word: string, positions: Position[]) => {
    // PROTEÇÃO: Verificar se a palavra já foi encontrada
    const isAlreadyFound = foundWords.some(fw => fw.word === word);
    if (isAlreadyFound) {
      logger.warn(`⚠️ Tentativa de adicionar palavra duplicada: "${word}" - IGNORANDO`, 'GAME_LOGIC');
      return;
    }

    const points = getPointsForWord(word);
    const newFoundWord = { word, positions: [...positions], points };
    
    logger.info(`📝 Adicionando palavra única: "${word}" = ${points} pontos (${foundWords.length + 1}/${TOTAL_WORDS})`);
    
    setFoundWords(prev => {
      // Verificação adicional antes de adicionar
      if (prev.some(fw => fw.word === word)) {
        logger.warn(`⚠️ Palavra já existe no array: "${word}" - não adicionando duplicata`);
        return prev;
      }
      const newArray = [...prev, newFoundWord];
      logger.info(`📊 Array de palavras atualizado. Total: ${newArray.length} palavras encontradas`);
      return newArray;
    });
    
    setPermanentlyMarkedCells(prev => [...prev, ...positions]);
    
    // Chama callback para UI - NÃO registra pontos aqui
    onWordFound(word, points);
  };

  const isCellPermanentlyMarked = (row: number, col: number) => {
    return permanentlyMarkedCells.some(pos => pos.row === row && pos.col === col);
  };

  const isCellHintHighlighted = (row: number, col: number) => {
    return hintHighlightedCells.some(pos => pos.row === row && pos.col === col);
  };

  // Função para fechar o modal do Game Over (usado no revive)
  const closeGameOver = () => {
    setShowGameOver(false);
  };

  return {
    foundWords,
    permanentlyMarkedCells,
    hintsUsed,
    showGameOver,
    showLevelComplete,
    hintHighlightedCells,
    isLevelCompleted,
    setHintsUsed,
    setShowGameOver,
    setShowLevelComplete,
    setHintHighlightedCells,
    addFoundWord,
    isCellPermanentlyMarked,
    isCellHintHighlighted,
    closeGameOver
  };
};
