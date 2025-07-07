/**
 * Utility functions for game scoring
 * DEPRECATED: Use GameScoringContext instead for dynamic configuration
 */

export const calculateWordPoints = (word: string): number => {
  const length = word.length;
  
  // Fallback values - Use GameScoringContext for dynamic configuration
  if (length >= 3 && length <= 5) {
    return 1;
  }
  
  if (length >= 6 && length <= 8) {
    return 2;
  }
  
  if (length >= 9 && length <= 10) {
    return 3;
  }
  
  if (length >= 11) {
    return 6;
  }
  
  return 0;
};