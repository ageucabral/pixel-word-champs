import React, { createContext, useContext, ReactNode } from 'react';
import { useGamePointsConfig } from '@/hooks/useGamePointsConfig';

interface GameScoringContextType {
  calculateWordPoints: (word: string) => number;
  loading: boolean;
  config: Record<string, number>;
}

const GameScoringContext = createContext<GameScoringContextType | undefined>(undefined);

interface GameScoringProviderProps {
  children: ReactNode;
}

export const GameScoringProvider: React.FC<GameScoringProviderProps> = ({ children }) => {
  const { config, loading } = useGamePointsConfig();

  const calculateWordPoints = (word: string): number => {
    const length = word.length;
    
    // Usar configurações do banco com fallbacks dos valores corretos (1, 2, 3, 6)
    if (length >= 3 && length <= 5) {
      return config['points_per_3_to_5_letter_word'] || 1;
    }
    
    if (length >= 6 && length <= 8) {
      return config['points_per_6_to_8_letter_word'] || 2;
    }
    
    if (length >= 9 && length <= 10) {
      return config['points_per_8_to_10_letter_word'] || 3;
    }
    
    if (length >= 11) {
      return config['points_per_11_to_20_letter_word'] || 6;
    }
    
    return 0;
  };

  return (
    <GameScoringContext.Provider 
      value={{ 
        calculateWordPoints, 
        loading, 
        config 
      }}
    >
      {children}
    </GameScoringContext.Provider>
  );
};

export const useGameScoring = () => {
  const context = useContext(GameScoringContext);
  if (context === undefined) {
    throw new Error('useGameScoring must be used within a GameScoringProvider');
  }
  return context;
};