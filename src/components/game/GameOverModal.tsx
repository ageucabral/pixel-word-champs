
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StopCircle, Play, X, CloudRain, Frown, RotateCcw } from 'lucide-react';
import { logger } from '@/utils/logger';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  wordsFound: number;
  totalWords: number;
  onRevive: () => void;
  onGoHome: () => void;
  canRevive: boolean;
}

const GameOverModal = ({ 
  isOpen, 
  score, 
  wordsFound, 
  totalWords, 
  onRevive, 
  onGoHome,
  canRevive 
}: GameOverModalProps) => {
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  if (!isOpen) return null;

  const handleReviveClick = () => {
    logger.info('Iniciando anúncio para revive...', {}, 'GAME_OVER_MODAL');
    setIsWatchingAd(true);
  };

  const handleCloseAd = () => {
    logger.info('Anúncio fechado - ativando revive e adicionando tempo', {}, 'GAME_OVER_MODAL');
    setIsWatchingAd(false);
    onRevive(); // Isso adiciona o tempo e fecha o modal do Game Over
  };

  const handleStopGame = () => {
    logger.info('Usuário escolheu parar o jogo - encerrando e marcando competição como concluída', {}, 'GAME_OVER_MODAL');
    onGoHome();
  };

  if (isWatchingAd) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
        <Card className="w-80 m-4 bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-gray-700 shadow-2xl shadow-purple-900/30">
          <CardContent className="p-6 text-center relative">
            <Button 
              onClick={handleCloseAd}
              className="absolute top-2 right-2 w-8 h-8 p-0 bg-gray-600 hover:bg-gray-700"
              variant="secondary"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="animate-pulse w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Play className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-lg font-bold mb-2 text-white">Anúncio em Exibição</h3>
            <p className="text-gray-300 mb-4">Assista ao anúncio para receber +30 segundos</p>
            
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <p className="text-sm text-gray-400">Clique no X quando o anúncio terminar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      {/* Efeitos de chuva melancólica de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-1 h-8 bg-blue-400/30 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-20 right-1/3 w-0.5 h-6 bg-gray-400/40 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '3.5s' }} />
        <div className="absolute top-32 left-1/3 w-1.5 h-10 bg-blue-500/25 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
        <div className="absolute top-40 right-1/4 w-0.5 h-4 bg-gray-500/30 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '2.8s' }} />
        <div className="absolute top-60 left-1/2 w-1 h-7 bg-blue-400/35 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.2s' }} />
        <div className="absolute top-80 right-1/5 w-0.5 h-5 bg-gray-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '3.8s' }} />
      </div>

      <Card className="w-96 m-4 bg-gradient-to-br from-slate-700 via-gray-800 to-slate-900 border-2 border-slate-600 shadow-2xl shadow-blue-900/40 animate-scale-in">
        <CardContent className="p-8 text-center relative overflow-hidden">
          {/* Fundo decorativo com nuvens escuras */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/60 via-gray-800/40 to-slate-900/60 animate-pulse" />
          
          {/* Elementos decorativos melancólicos */}
          <div className="absolute top-4 left-6">
            <CloudRain className="w-5 h-5 text-blue-400/60 animate-pulse" />
          </div>
          <div className="absolute top-6 right-8">
            <Frown className="w-4 h-4 text-gray-400/70 animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute bottom-6 left-8">
            <CloudRain className="w-3 h-3 text-blue-500/50 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10">
            {/* Seção do ícone principal com animação triste */}
            <div className="mb-6 relative">
              <div className="relative inline-block">
                {/* Emoji ou ícone triste com efeito */}
                <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-xl border-4 border-gray-500/30 animate-bounce">
                  <div className="text-4xl">😢</div>
                </div>
                
                {/* Gotas de "lágrima" */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-3 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 translate-x-2 w-1.5 h-2 bg-blue-500/50 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }} />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-200 mb-2 animate-fade-in">
                ⏰ Ops! Tempo Esgotado! ⏰
              </h2>
              <p className="text-gray-400 text-lg font-medium animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Não desista! Você ainda pode continuar...
              </p>
            </div>
            
            {/* Seção da pontuação com tema melancólico */}
            <div className="bg-gradient-to-r from-slate-600 to-gray-600 rounded-2xl p-6 mb-6 shadow-lg border border-slate-500/30 transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <CloudRain className="w-6 h-6 text-blue-300" />
                <div>
                  <p className="text-gray-200 text-sm font-medium">Sua Pontuação Atual</p>
                  <p className="text-white text-2xl font-bold">{score}</p>
                </div>
                <CloudRain className="w-6 h-6 text-blue-300" />
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Palavras Encontradas:</span>
                <span className="font-bold text-blue-300">{wordsFound}/{totalWords}</span>
              </div>
              
              {/* Barra de progresso melancólica */}
              <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(wordsFound / totalWords) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Botões de ação com estilo melancólico gamificado */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              {canRevive && (
                <Button 
                  onClick={handleReviveClick}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-emerald-500/30"
                >
                  <RotateCcw className="w-5 h-5 mr-3" />
                  <span className="font-bold">💪 Reviver (+30s)</span>
                  <Play className="w-5 h-5 ml-3" />
                </Button>
              )}
              
              <Button 
                onClick={handleStopGame}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-red-500/30"
              >
                <StopCircle className="w-5 h-5 mr-3" />
                <span className="font-bold">Finalizar Jogo</span>
              </Button>
            </div>
            
            {canRevive && (
              <div className="mt-4 p-3 bg-emerald-900/30 rounded-lg border border-emerald-600/30 animate-pulse">
                <p className="text-sm text-emerald-300 font-medium">
                  💡 Dica: Use quantos revives precisar!
                </p>
              </div>
            )}
          </div>
          
          {/* Efeitos de brilho suave nos cantos */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-xl" />
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-gray-400/20 to-transparent rounded-full blur-xl" />
          
          {/* Efeito de neblina */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-gray-800/10 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
        </CardContent>
      </Card>
    </div>
  );
};

export default GameOverModal;
