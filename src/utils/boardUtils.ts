import { GAME_CONSTANTS } from '@/constants/game';

export interface Position {
  row: number;
  col: number;
}

export interface PlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: 'horizontal' | 'vertical' | 'diagonal';
  positions: Position[];
}

export const getBoardSize = (level: number): number => {
  return GAME_CONSTANTS.BOARD_HEIGHT; // Agora retorna 8
};

export const getMobileBoardSize = (level: number): number => {
  return GAME_CONSTANTS.BOARD_HEIGHT; // Agora retorna 8
};

export const getBoardWidth = (level: number): number => {
  return GAME_CONSTANTS.BOARD_WIDTH; // Agora retorna 12
};

export const getMobileBoardWidth = (level: number): number => {
  return GAME_CONSTANTS.BOARD_WIDTH; // Agora retorna 12
};

export const getLevelWords = (level: number): string[] => {
  return [];
};

export const getCellSize = (boardSize: number, isMobile: boolean = false): number => {
  return isMobile ? GAME_CONSTANTS.MOBILE_CELL_SIZE : GAME_CONSTANTS.DESKTOP_CELL_SIZE;
};


// Função para validar se o tabuleiro contém todas as palavras
export const validateBoardContainsWords = (board: string[][], words: string[]): boolean => {
  const height = board.length;
  const width = board[0]?.length || 0;
  const directions = [
    { row: 0, col: 1 },   // horizontal
    { row: 1, col: 0 },   // vertical
    { row: 1, col: 1 },   // diagonal
    { row: 0, col: -1 },  // horizontal reversa
    { row: -1, col: 0 },  // vertical reversa
    { row: -1, col: -1 }, // diagonal reversa
    { row: 1, col: -1 },  // diagonal anti
    { row: -1, col: 1 }   // diagonal anti reversa
  ];

  for (const word of words) {
    let found = false;
    
    // Procurar a palavra em todas as posições e direções
    for (let row = 0; row < height && !found; row++) {
      for (let col = 0; col < width && !found; col++) {
        for (const dir of directions) {
          if (checkWordAtPosition(board, word, row, col, dir.row, dir.col, height, width)) {
            found = true;
            break;
          }
        }
      }
    }
    
    if (!found) {
      console.error(`Palavra "${word}" não encontrada no tabuleiro!`);
      return false;
    }
  }
  
  return true;
};

const checkWordAtPosition = (
  board: string[][], 
  word: string, 
  startRow: number, 
  startCol: number, 
  deltaRow: number, 
  deltaCol: number,
  height: number,
  width: number
): boolean => {
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * deltaRow;
    const col = startCol + i * deltaCol;
    
    if (row < 0 || row >= height || col < 0 || col >= width) {
      return false;
    }
    
    if (board[row][col] !== word[i]) {
      return false;
    }
  }
  
  return true;
};
