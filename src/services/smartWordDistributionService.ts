import { type Position, type PlacedWord } from '@/utils/boardUtils';
import { logger } from '@/utils/logger';
import { BoardQualityAnalyzer, shuffleArray } from '@/utils/boardQuality';

// Todas as 8 direções possíveis
type ExtendedDirection = 
  | 'horizontal-left-right'
  | 'horizontal-right-left' 
  | 'vertical-top-bottom'
  | 'vertical-bottom-top'
  | 'diagonal-tl-br'
  | 'diagonal-br-tl'
  | 'diagonal-tr-bl'
  | 'diagonal-bl-tr';

interface WordPlacementCandidate {
  word: string;
  row: number;
  col: number;
  direction: ExtendedDirection;
  positions: Position[];
  score: number;
}

interface DistributionMetrics {
  [key: string]: number;
  centerDistance: number;
  wordSeparation: number;
}

// 🎯 CORREÇÃO: Interface interna para gerenciar palavras com ExtendedDirection
interface InternalPlacedWord {
  word: string;
  startRow: number;
  startCol: number;
  direction: ExtendedDirection;
  positions: Position[];
}

export class SmartWordDistributionService {
  private height: number;
  private width: number;
  private board: string[][];
  private placedWords: InternalPlacedWord[] = []; // 🎯 CORRIGIDO: Usar tipo interno
  private qualityAnalyzer: BoardQualityAnalyzer;
  private readonly MIN_WORD_DISTANCE = 2;
  private levelConfig?: any; // ✨ NOVO: Configuração específica do nível

  constructor(height: number, width: number = 12, levelConfig?: any) {
    this.height = height;
    this.width = width;
    this.board = Array(height).fill(null).map(() => Array(width).fill(''));
    this.qualityAnalyzer = new BoardQualityAnalyzer(height, width);
    this.levelConfig = levelConfig; // ✨ NOVO: Armazenar configuração do nível
  }

  public distributeWords(words: string[]): { board: string[][]; placedWords: PlacedWord[] } {
    logger.info('🎯 Iniciando distribuição inteligente NÍVEL-ESPECÍFICA', {
      wordsCount: words.length,
      boardSize: `${this.height}x${this.width}`,
      levelStrategy: this.levelConfig?.strategy || 'default',
      levelSeed: this.levelConfig?.seed?.toString(16).substring(0, 8) || 'none'
    }, 'SMART_DISTRIBUTION');

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      this.resetBoard();
      
      // ✨ NOVO: Usar embaralhamento específico do nível se disponível
      let shuffledWords;
      if (this.levelConfig) {
        const shuffler = new (await import('@/utils/advancedShuffling')).AdvancedShuffler(this.levelConfig.seed);
        const shuffleResult = shuffler.shuffle(words, this.levelConfig.shuffleMethod);
        shuffledWords = shuffleResult.shuffled;
        
        logger.debug(`🔀 Embaralhamento nível-específico: ${shuffleResult.method} (entropy: ${shuffleResult.entropy.toFixed(2)})`, undefined, 'SMART_DISTRIBUTION');
      } else {
        shuffledWords = shuffleArray(words);
      }
      
      for (const word of shuffledWords) {
        this.placeWordOptimally(word);
      }

      const convertedWords = this.convertToLegacyFormat(this.placedWords);
      if (!this.qualityAnalyzer.shouldRegenerate(convertedWords) || attempts === maxAttempts - 1) {
        break;
      }

      attempts++;
      logger.info(`🔄 Regenerando tabuleiro nível-específico (tentativa ${attempts + 1}/${maxAttempts})`, {
        placedWords: this.placedWords.length
      }, 'SMART_DISTRIBUTION');
    }

    this.fillEmptySpaces();

    logger.info('✅ Distribuição NÍVEL-ESPECÍFICA concluída', {
      placedWords: this.placedWords.length,
      attempts: attempts + 1,
      levelStrategy: this.levelConfig?.strategy || 'default',
      distribution: this.getDistributionStats()
    }, 'SMART_DISTRIBUTION');

    return {
      board: this.board.map(row => [...row]),
      placedWords: this.convertToLegacyFormat(this.placedWords)
    };
  }

  private resetBoard(): void {
    this.board = Array(this.height).fill(null).map(() => Array(this.width).fill(''));
    this.placedWords = [];
  }

  private placeWordOptimally(word: string): boolean {
    const candidates = this.generatePlacementCandidates(word);
    
    if (candidates.length === 0) {
      logger.warn(`⚠️ Nenhuma posição válida encontrada para "${word}"`, undefined, 'SMART_DISTRIBUTION');
      return false;
    }

    // Ordenar candidatos por score (melhor distribuição primeiro)
    candidates.sort((a, b) => b.score - a.score);
    
    const bestCandidate = candidates[0];
    this.placeWord(bestCandidate);
    
    logger.debug(`✅ Palavra "${word}" colocada ${bestCandidate.direction} em (${bestCandidate.row}, ${bestCandidate.col}) com score ${bestCandidate.score.toFixed(2)}`, undefined, 'SMART_DISTRIBUTION');
    
    return true;
  }

  private generatePlacementCandidates(word: string): WordPlacementCandidate[] {
    const candidates: WordPlacementCandidate[] = [];
    const allDirections: ExtendedDirection[] = [
      'horizontal-left-right',
      'horizontal-right-left',
      'vertical-top-bottom', 
      'vertical-bottom-top',
      'diagonal-tl-br',
      'diagonal-br-tl',
      'diagonal-tr-bl',
      'diagonal-bl-tr'
    ];

    // Embaralhar direções para adicionar aleatoriedade
    const shuffledDirections = shuffleArray(allDirections);

    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        for (const direction of shuffledDirections) {
          const positions = this.getWordPositions(word, row, col, direction);
          
          if (this.canPlaceWord(word, positions) && this.meetsDistanceRequirement(row, col)) {
            const score = this.calculatePlacementScore(word, row, col, direction, positions);
            
            candidates.push({
              word,
              row,
              col,
              direction,
              positions,
              score
            });
          }
        }
      }
    }

    return candidates;
  }

  private getWordPositions(
    word: string, 
    row: number, 
    col: number, 
    direction: ExtendedDirection
  ): Position[] {
    const positions: Position[] = [];
    
    for (let i = 0; i < word.length; i++) {
      let newRow = row;
      let newCol = col;
      
      switch (direction) {
        case 'horizontal-left-right':
          newCol = col + i;
          break;
        case 'horizontal-right-left':
          newCol = col - i;
          break;
        case 'vertical-top-bottom':
          newRow = row + i;
          break;
        case 'vertical-bottom-top':
          newRow = row - i;
          break;
        case 'diagonal-tl-br': // Top-left to bottom-right
          newRow = row + i;
          newCol = col + i;
          break;
        case 'diagonal-br-tl': // Bottom-right to top-left
          newRow = row - i;
          newCol = col - i;
          break;
        case 'diagonal-tr-bl': // Top-right to bottom-left
          newRow = row + i;
          newCol = col - i;
          break;
        case 'diagonal-bl-tr': // Bottom-left to top-right
          newRow = row - i;
          newCol = col + i;
          break;
      }
      
      positions.push({ row: newRow, col: newCol });
    }
    
    return positions;
  }

  private meetsDistanceRequirement(row: number, col: number): boolean {
    for (const placedWord of this.placedWords) {
      const distance = this.qualityAnalyzer.calculateMinimumDistance(
        { row, col },
        { row: placedWord.startRow, col: placedWord.startCol }
      );
      
      if (distance < this.MIN_WORD_DISTANCE) {
        return false;
      }
    }
    return true;
  }

  private calculatePlacementScore(
    word: string, 
    row: number, 
    col: number, 
    direction: ExtendedDirection,
    positions: Position[]
  ): number {
    let score = 0;

    // 1. Pontuação por distribuição de direções (evitar concentração)
    const currentDistribution = this.getDistributionStats();
    const directionBalance = this.calculateDirectionBalance(direction, currentDistribution);
    score += directionBalance * 40;

    // 2. Pontuação por distância de outras palavras (evitar proximidade)
    const separationScore = this.calculateSeparationScore(positions);
    score += separationScore * 30;

    // 3. Pontuação por distância do centro (distribuir pelo tabuleiro)
    const centerDistance = this.calculateCenterDistance(row, col, word.length, direction);
    const centerScore = this.calculateCenterScore(centerDistance);
    score += centerScore * 20;

    // 4. Penalizar bordas excessivas
    const borderPenalty = this.calculateBorderPenalty(positions);
    score -= borderPenalty * 10;

    // 5. Bonificar intersecções controladas
    const intersectionBonus = this.calculateIntersectionBonus(word, positions);
    score += intersectionBonus * 15;

    return score;
  }

  private calculateDirectionBalance(
    direction: ExtendedDirection,
    currentDistribution: DistributionMetrics
  ): number {
    const directionCounts = Object.keys(currentDistribution)
      .filter(key => key !== 'centerDistance' && key !== 'wordSeparation')
      .map(key => currentDistribution[key]);
    
    const total = directionCounts.reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return 1; // Primeira palavra sempre tem score máximo
    
    const currentCount = currentDistribution[direction] || 0;
    const idealRatio = 1/8; // 12.5% para cada direção
    const currentRatio = currentCount / total;
    
    return Math.max(0, idealRatio - currentRatio) * 8;
  }

  private calculateSeparationScore(positions: Position[]): number {
    let minDistance = Infinity;

    for (const placedWord of this.placedWords) {
      for (const newPos of positions) {
        for (const existingPos of placedWord.positions) {
          const distance = Math.sqrt(
            Math.pow(newPos.row - existingPos.row, 2) + 
            Math.pow(newPos.col - existingPos.col, 2)
          );
          minDistance = Math.min(minDistance, distance);
        }
      }
    }

    if (minDistance === Infinity) return 1; // Primeira palavra

    return Math.min(1, Math.max(0, (minDistance - 1) / 3));
  }

  private calculateCenterDistance(
    row: number, 
    col: number, 
    wordLength: number, 
    direction: ExtendedDirection
  ): number {
    const centerRow = this.height / 2;
    const centerCol = this.width / 2;
    
    let wordCenterRow = row;
    let wordCenterCol = col;

    // Calcular centro da palavra baseado na direção
    switch (direction) {
      case 'horizontal-left-right':
      case 'horizontal-right-left':
        wordCenterCol = col + (direction === 'horizontal-left-right' ? wordLength / 2 : -wordLength / 2);
        break;
      case 'vertical-top-bottom':
      case 'vertical-bottom-top':
        wordCenterRow = row + (direction === 'vertical-top-bottom' ? wordLength / 2 : -wordLength / 2);
        break;
      case 'diagonal-tl-br':
      case 'diagonal-br-tl':
      case 'diagonal-tr-bl':
      case 'diagonal-bl-tr':
        const deltaRow = direction.includes('t') && direction.includes('br') ? wordLength / 2 : -wordLength / 2;
        const deltaCol = direction.includes('l') && direction.includes('tr') ? wordLength / 2 : -wordLength / 2;
        wordCenterRow = row + deltaRow;
        wordCenterCol = col + deltaCol;
        break;
    }

    return Math.sqrt(
      Math.pow(wordCenterRow - centerRow, 2) + 
      Math.pow(wordCenterCol - centerCol, 2)
    );
  }

  private calculateCenterScore(distance: number): number {
    const maxDistance = Math.sqrt(Math.pow(this.height/2, 2) + Math.pow(this.width/2, 2));
    const normalizedDistance = distance / maxDistance;
    const idealDistance = 0.4;
    
    return 1 - Math.abs(normalizedDistance - idealDistance);
  }

  private calculateBorderPenalty(positions: Position[]): number {
    let borderCells = 0;
    
    for (const pos of positions) {
      if (pos.row === 0 || pos.row === this.height - 1 || 
          pos.col === 0 || pos.col === this.width - 1) {
        borderCells++;
      }
    }
    
    return borderCells / positions.length;
  }

  private calculateIntersectionBonus(word: string, positions: Position[]): number {
    let intersections = 0;
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const currentLetter = this.board[pos.row][pos.col];
      
      if (currentLetter !== '' && currentLetter === word[i]) {
        intersections++;
      }
    }
    
    return Math.min(intersections / positions.length, 0.3);
  }

  private canPlaceWord(word: string, positions: Position[]): boolean {
    // Verificar limites do tabuleiro
    for (const pos of positions) {
      if (pos.row < 0 || pos.row >= this.height || 
          pos.col < 0 || pos.col >= this.width) {
        return false;
      }
    }

    // Verificar conflitos (permitir intersecções apenas com letras iguais)
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const currentLetter = this.board[pos.row][pos.col];
      
      if (currentLetter !== '' && currentLetter !== word[i]) {
        return false;
      }
    }

    return true;
  }

  private placeWord(candidate: WordPlacementCandidate): void {
    // Colocar letras no tabuleiro
    for (let i = 0; i < candidate.positions.length; i++) {
      const pos = candidate.positions[i];
      this.board[pos.row][pos.col] = candidate.word[i];
    }

    // Adicionar à lista de palavras colocadas
    this.placedWords.push({
      word: candidate.word,
      startRow: candidate.row,
      startCol: candidate.col,
      direction: candidate.direction,
      positions: [...candidate.positions]
    });
  }

  // 🎯 CORRIGIDO: Converter ExtendedDirection para direção legada
  private convertToLegacyFormat(placedWords: InternalPlacedWord[]): PlacedWord[] {
    return placedWords.map(word => ({
      word: word.word,
      startRow: word.startRow,
      startCol: word.startCol,
      direction: this.mapToLegacyDirection(word.direction),
      positions: word.positions
    }));
  }

  private mapToLegacyDirection(extendedDirection: ExtendedDirection): 'horizontal' | 'vertical' | 'diagonal' {
    if (extendedDirection.includes('horizontal')) return 'horizontal';
    if (extendedDirection.includes('vertical')) return 'vertical';
    return 'diagonal';
  }

  private getDistributionStats(): DistributionMetrics {
    const stats: DistributionMetrics = {
      'horizontal-left-right': 0,
      'horizontal-right-left': 0,
      'vertical-top-bottom': 0,
      'vertical-bottom-top': 0,
      'diagonal-tl-br': 0,
      'diagonal-br-tl': 0,
      'diagonal-tr-bl': 0,
      'diagonal-bl-tr': 0,
      centerDistance: 0,
      wordSeparation: 0
    };

    for (const word of this.placedWords) {
      if (word.direction in stats) {
        stats[word.direction as keyof DistributionMetrics]++;
      }
    }

    return stats;
  }

  private fillEmptySpaces(): void {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let filledCount = 0;
    
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.board[row][col] === '') {
          this.board[row][col] = letters[Math.floor(Math.random() * letters.length)];
          filledCount++;
        }
      }
    }
    
    logger.debug(`🔤 Preenchidas ${filledCount} células vazias`, undefined, 'SMART_DISTRIBUTION');
  }
}
