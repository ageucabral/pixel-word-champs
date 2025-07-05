
import { type Position, type PlacedWord } from '@/utils/boardUtils';
import { logger } from '@/utils/logger';

export interface WordPlacementResult {
  board: string[][];
  placedWords: PlacedWord[];
}

export class WordPlacer {
  private board: string[][];
  private placedWords: PlacedWord[];
  private height: number;
  private width: number;

  constructor(height: number, width: number = height) {
    this.height = height;
    this.width = width;
    this.board = Array(height).fill(null).map(() => Array(width).fill(''));
    this.placedWords = [];
  }

  canPlaceWord(word: string, row: number, col: number, direction: 'horizontal' | 'vertical' | 'diagonal'): boolean {
    const positions = this.getWordPositions(word, row, col, direction);
    
    // Verificar se todas as posições estão dentro dos limites
    for (const pos of positions) {
      if (pos.row < 0 || pos.row >= this.height || pos.col < 0 || pos.col >= this.width) {
        return false;
      }
    }

    // Verificar se as posições estão vazias ou têm a mesma letra
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const currentLetter = this.board[pos.row][pos.col];
      const requiredLetter = word[i];
      
      if (currentLetter !== '' && currentLetter !== requiredLetter) {
        return false;
      }
    }

    return true;
  }

  placeWord(word: string, row: number, col: number, direction: 'horizontal' | 'vertical' | 'diagonal'): void {
    const positions = this.getWordPositions(word, row, col, direction);
    
    // Colocar as letras no tabuleiro
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      this.board[pos.row][pos.col] = word[i];
    }

    // Adicionar à lista de palavras colocadas
    this.placedWords.push({
      word,
      startRow: row,
      startCol: col,
      direction,
      positions: [...positions]
    });
  }

  tryPlaceWordCentered(word: string): boolean {
    const centerRow = Math.floor(this.height / 2);
    const centerCol = Math.floor(this.width / 2);
    
    // Tentar posições próximas ao centro
    const attempts = [
      { row: centerRow, col: centerCol - Math.floor(word.length / 2), dir: 'horizontal' as const },
      { row: centerRow - Math.floor(word.length / 2), col: centerCol, dir: 'vertical' as const },
      { row: centerRow - Math.floor(word.length / 2), col: centerCol - Math.floor(word.length / 2), dir: 'diagonal' as const },
      // Posições alternativas próximas ao centro
      { row: centerRow - 1, col: centerCol - Math.floor(word.length / 2), dir: 'horizontal' as const },
      { row: centerRow + 1, col: centerCol - Math.floor(word.length / 2), dir: 'horizontal' as const },
      { row: centerRow - Math.floor(word.length / 2), col: centerCol - 1, dir: 'vertical' as const },
      { row: centerRow - Math.floor(word.length / 2), col: centerCol + 1, dir: 'vertical' as const }
    ];

    for (const attempt of attempts) {
      if (this.canPlaceWord(word, attempt.row, attempt.col, attempt.dir)) {
        this.placeWord(word, attempt.row, attempt.col, attempt.dir);
        logger.debug(`✅ "${word}" colocada ${attempt.dir} no centro em (${attempt.row}, ${attempt.col})`, undefined, 'WORD_PLACEMENT');
        return true;
      }
    }

    return false;
  }

  private getWordPositions(word: string, row: number, col: number, direction: 'horizontal' | 'vertical' | 'diagonal'): Position[] {
    const positions: Position[] = [];
    
    for (let i = 0; i < word.length; i++) {
      let newRow = row;
      let newCol = col;
      
      switch (direction) {
        case 'horizontal':
          newCol = col + i;
          break;
        case 'vertical':
          newRow = row + i;
          break;
        case 'diagonal':
          newRow = row + i;
          newCol = col + i;
          break;
      }
      
      positions.push({ row: newRow, col: newCol });
    }
    
    return positions;
  }

  getResult(): WordPlacementResult {
    return {
      board: this.board.map(row => [...row]),
      placedWords: [...this.placedWords]
    };
  }
}
