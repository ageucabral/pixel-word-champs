/**
 * Utility functions for game scoring
 */

export const calculateWordPoints = (word: string): number => {
  const length = word.length;
  
  // Faixas de pontuação baseadas no tamanho da palavra
  if (length >= 3 && length <= 5) {
    return 30;
  }
  
  if (length >= 6 && length <= 8) {
    return 60;
  }
  
  if (length >= 9 && length <= 10) {
    return 100;
  }
  
  if (length >= 11) {
    return 150;
  }
  
  return 0;
};