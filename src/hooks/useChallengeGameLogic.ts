
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gameService } from '@/services/gameService';
import { competitionParticipationService } from '@/services/competitionParticipationService';
import { challengeProgressService } from '@/services/challengeProgressService';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export const useChallengeGameLogic = (challengeId: string) => {
  const { user } = useAuth();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [gameSession, setGameSession] = useState<any>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [hasMarkedParticipation, setHasMarkedParticipation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('Iniciando...');
  const [isResuming, setIsResuming] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const maxLevels = 20;

  useEffect(() => {
    initializeGameSession();
  }, [challengeId]);

  const initializeGameSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadingStep('Preparando sessão...');
      
      logger.info('🎮 Inicializando sessão de jogo para competição:', { challengeId });
      
      // Verificar se a competição existe em custom_competitions
      setLoadingStep('Validando competição...');
      const { data: competition, error: competitionError } = await supabase
        .from('custom_competitions')
        .select('id, title, status')
        .eq('id', challengeId)
        .single();

      if (competitionError) {
        logger.error('❌ Competição não encontrada:', competitionError);
        setError('Competição não encontrada. Verifique se o ID está correto.');
        return;
      }

      if (competition.status !== 'active') {
        logger.error('❌ Competição não está ativa:', competition.status);
        setError(`Competição não está ativa: ${competition.status}`);
        return;
      }

      // Verificar progresso existente do usuário
      if (user) {
        setLoadingStep('Verificando progresso...');
        const existingProgress = await challengeProgressService.getProgress(user.id, challengeId);
        
        if (existingProgress) {
          if (existingProgress.is_completed) {
            // Usuário já completou esta competição
            logger.info('🏆 Usuário já completou esta competição', { 
              challengeId,
              userId: user.id,
              finalScore: existingProgress.total_score 
            });
            setAlreadyCompleted(true);
            setTotalScore(existingProgress.total_score);
            setCurrentLevel(20);
            setLoadingStep('Competição já concluída!');
            return;
          } else {
            // Usuário tem progresso, mas não completou
            logger.info('🔄 Retomando progresso existente', { 
              challengeId,
              userId: user.id,
              currentLevel: existingProgress.current_level,
              totalScore: existingProgress.total_score
            });
            setCurrentLevel(existingProgress.current_level);
            setTotalScore(existingProgress.total_score);
            setIsResuming(true);
            setLoadingStep(`Continuando do nível ${existingProgress.current_level}...`);
          }
        } else {
          setLoadingStep('Iniciando novo desafio...');
        }
      }

      logger.info('✅ Competição validada, criando sessão de jogo...');
      setLoadingStep('Criando sessão de jogo...');
      
      // Criar uma nova sessão de jogo para esta competição
      const sessionResponse = await gameService.createGameSession({
        level: currentLevel,
        boardSize: 10,
        competitionId: challengeId
      });

      if (!sessionResponse.success) {
        logger.error('❌ Erro ao criar sessão:', sessionResponse.error);
        setError(sessionResponse.error || 'Erro ao criar sessão de jogo');
        return;
      }

      const session = sessionResponse.data;
      logger.info('✅ Sessão de jogo criada:', session.id);
      
      setGameSession(session);
      setIsGameStarted(true);
      setLoadingStep('Sessão criada com sucesso!');
      
    } catch (error) {
      logger.error('❌ Erro inesperado ao inicializar sessão:', error);
      setError('Erro inesperado ao carregar o jogo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 FUNÇÃO CORRIGIDA: Melhor tratamento de erro e timeout
  const markParticipationAsCompleted = async (): Promise<boolean> => {
    if (hasMarkedParticipation || !user) {
      logger.info('Participação já foi marcada como concluída ou usuário não logado');
      return true; // Retorna true se já foi processado
    }

    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000) // 10 segundos
    );

    try {
      logger.info('🏁 Iniciando marcação de participação como concluída...', {
        challengeId,
        userId: user.id,
        gameSessionId: gameSession?.id
      });

      // Race entre a operação e o timeout
      await Promise.race([
        (async () => {
          await competitionParticipationService.markUserAsParticipated(challengeId, user.id);
          if (gameSession?.id) {
            await gameService.completeGameSession(gameSession.id);
          }
        })(),
        timeout
      ]);

      setHasMarkedParticipation(true);
      logger.info('✅ Participação marcada como concluída com sucesso');
      return true;

    } catch (error) {
      logger.error('❌ Erro ao marcar participação (mas continuando navegação):', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error,
        challengeId,
        userId: user.id
      });
      
      // 🎯 IMPORTANTE: Mesmo com erro, permitir que o usuário saia
      return false; // Indica que houve erro, mas não impede navegação
    }
  };

  const handleTimeUp = () => {
    logger.info('Tempo esgotado!');
  };

  const handleLevelComplete = async (levelScore: number) => {
    const newTotalScore = totalScore + levelScore;
    setTotalScore(newTotalScore);
    
    // Salvar progresso após completar nível
    if (user) {
      await challengeProgressService.saveProgress({
        userId: user.id,
        competitionId: challengeId,
        currentLevel: currentLevel,
        totalScore: newTotalScore
      });
    }
    
    logger.info(`Nível ${currentLevel} completado! Pontuação do nível: ${levelScore}. Total: ${newTotalScore}. Progresso salvo.`);
  };

  const handleAdvanceLevel = () => {
    if (currentLevel < maxLevels) {
      const nextLevel = currentLevel + 1;
      setCurrentLevel(nextLevel);
      setIsGameStarted(false);
      setTimeout(() => {
        setIsGameStarted(true);
      }, 100);
      
      logger.info(`Avançando para o nível ${nextLevel}`);
    } else {
      // Completou todos os 20 níveis
      if (user) {
        challengeProgressService.markAsCompleted(user.id, challengeId, totalScore);
      }
      setGameCompleted(true);
      logger.info('🎉 Você completou todos os 20 níveis!');
    }
  };

  const handleRetry = () => {
    logger.info('🔄 Tentando novamente...');
    setError(null);
    setGameSession(null);
    setIsGameStarted(false);
    setHasMarkedParticipation(false);
    setAlreadyCompleted(false);
    setIsResuming(false);
    initializeGameSession();
  };

  return {
    currentLevel,
    totalScore,
    gameSession,
    isGameStarted,
    gameCompleted,
    isLoading,
    error,
    loadingStep,
    isResuming,
    alreadyCompleted,
    handleTimeUp,
    handleLevelComplete,
    handleAdvanceLevel,
    handleRetry,
    markParticipationAsCompleted
  };
};
