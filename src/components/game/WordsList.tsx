
import React from 'react';
import { CheckCircle, Star, Target, Lock, Sparkles } from 'lucide-react';
import { useGameScoring } from '@/contexts/GameScoringContext';

interface FoundWord {
  word: string;
  positions: Array<{row: number, col: number}>;
  points: number;
}

interface WordsListProps {
  levelWords: string[];
  foundWords: FoundWord[];
  getWordColor: (wordIndex: number) => string;
}

const WordsList = ({ levelWords, foundWords, getWordColor }: WordsListProps) => {
  const TOTAL_WORDS = 5;
  const { calculateWordPoints } = useGameScoring();

  // Identificar apenas a palavra com maior pontuação
  const wordsWithPoints = levelWords.map(word => ({
    word,
    points: calculateWordPoints(word)
  }));
  
  const sortedByPoints = [...wordsWithPoints].sort((a, b) => b.points - a.points);
  const hiddenWords = new Set([sortedByPoints[0]?.word]);

  return (
    <div className="p-2 space-y-2">
      {/* Header compacto integrado */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Target className="w-3 h-3 text-purple-600" />
            <Sparkles className="w-1 h-1 text-yellow-500 absolute -top-0.5 -right-0.5 animate-pulse" />
          </div>
          <span className="text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Palavras
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-blue-100 px-1.5 py-0.5 rounded-full border border-purple-200">
          <span className="text-xs font-bold text-purple-700">{foundWords.length}</span>
          <span className="text-xs text-purple-500">/</span>
          <span className="text-xs text-purple-600">{TOTAL_WORDS}</span>
        </div>
      </div>
      
      {/* Grid horizontal compacto - palavras como chips sem truncamento */}
      <div className="grid grid-cols-2 gap-1">
        {levelWords.map((word, index) => {
          const foundWordIndex = foundWords.findIndex(fw => fw.word === word);
          const isFound = foundWordIndex !== -1;
          const foundWord = foundWords[foundWordIndex];
          const isHidden = hiddenWords.has(word);
          
          return (
            <div 
              key={index}
              className={`
                relative flex items-center justify-between px-1.5 py-1 rounded-lg transition-all duration-300 transform hover:scale-[1.02] border text-xs
                ${isFound 
                  ? `bg-gradient-to-r ${getWordColor(foundWordIndex)} text-white shadow-sm border-white/30 animate-bounce-in` 
                  : isHidden
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm border-purple-300'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:border-gray-300 shadow-sm'
                }
              `}
            >
              {/* Ícone e palavra - sem truncamento */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {isFound && (
                  <CheckCircle className="w-2.5 h-2.5 text-white flex-shrink-0" />
                )}
                {isHidden && !isFound && (
                  <Lock className="w-2.5 h-2.5 text-white/90 flex-shrink-0" />
                )}
                <span className={`font-bold text-xs whitespace-nowrap ${
                  isFound || isHidden ? 'text-white' : 'text-gray-700'
                }`}>
                  {isHidden && !isFound 
                    ? `${word.length} Letras` 
                    : word
                  }
                </span>
              </div>
              
              {/* Pontos ou indicador ultra compacto */}
              <div className="flex items-center flex-shrink-0 ml-1">
                {isFound && foundWord && (
                  <span className="text-xs font-bold text-white bg-black/20 px-1 py-0.5 rounded-full border border-white/20">
                    +{foundWord.points}
                  </span>
                )}
                {isHidden && !isFound && (
                  <Star className="w-2 h-2 text-yellow-300" />
                )}
              </div>

              {/* Efeito de brilho para palavras encontradas */}
              {isFound && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-lg pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Status de conclusão ultra compacto */}
      {foundWords.length === TOTAL_WORDS && (
        <div className="flex items-center justify-center gap-1 px-2 py-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white rounded-lg shadow-sm border border-green-300 animate-bounce-in">
          <Star className="w-2.5 h-2.5 animate-spin" />
          <span className="text-xs font-bold">Completo!</span>
          <Star className="w-2.5 h-2.5 animate-spin" style={{ animationDelay: '0.5s' }} />
        </div>
      )}
    </div>
  );
};

export default WordsList;
