// Sistema de posicionamento estratégico com múltiplas abordagens
// Implementa 6 estratégias diferentes de posicionamento baseadas no nível

import { PlacementStrategy, DirectionWeights, PositionBias } from './levelBasedGeneration';
import { type Position } from '@/utils/boardUtils';
import { logger } from '@/utils/logger';

interface PlacementCandidate {
  row: number;
  col: number;
  direction: 'horizontal' | 'vertical' | 'diagonal';
  score: number;
  positions: Position[];
}

interface PlacementContext {
  boardHeight: number;
  boardWidth: number;
  placedWords: Array<{
    startRow: number;
    startCol: number;
    positions: Position[];
  }>;
  strategy: PlacementStrategy;
  directionWeights: DirectionWeights;
  positionBias: PositionBias;
  seed: number;
}

class StrategicPlacer {
  private rng: () => number;
  private context: PlacementContext;

  constructor(context: PlacementContext) {
    this.context = context;
    this.rng = this.createSeededRandom(context.seed);
  }

  public findBestPlacement(word: string): PlacementCandidate | null {
    const candidates = this.generateCandidates(word);
    
    if (candidates.length === 0) {
      logger.warn(`⚠️ Nenhuma posição válida encontrada para "${word}" com estratégia ${this.context.strategy}`, undefined, 'STRATEGIC_PLACEMENT');
      return null;
    }

    // Aplicar estratégia específica para scoring
    const scoredCandidates = candidates.map(candidate => ({
      ...candidate,
      score: this.calculateStrategicScore(candidate, word)
    }));

    // Ordenar por score (melhor primeiro)
    scoredCandidates.sort((a, b) => b.score - a.score);

    const best = scoredCandidates[0];
    
    logger.debug(`✅ Melhor posição para "${word}": ${best.direction} em (${best.row}, ${best.col}) com score ${best.score.toFixed(2)}`, undefined, 'STRATEGIC_PLACEMENT');

    return best;
  }

  private generateCandidates(word: string): PlacementCandidate[] {
    const candidates: PlacementCandidate[] = [];
    const directions: Array<'horizontal' | 'vertical' | 'diagonal'> = ['horizontal', 'vertical', 'diagonal'];

    // Gerar posições baseadas na estratégia
    const positions = this.generateStrategicPositions();

    for (const { row, col } of positions) {
      for (const direction of directions) {
        const positions = this.getWordPositions(word, row, col, direction);
        
        if (this.isValidPlacement(positions)) {
          candidates.push({
            row,
            col,
            direction,
            score: 0, // Será calculado depois
            positions
          });
        }
      }
    }

    return candidates;
  }

  private generateStrategicPositions(): Position[] {
    switch (this.context.strategy) {
      case 'center-first':
        return this.generateCenterFirstPositions();
      case 'edges-first':
        return this.generateEdgesFirstPositions();
      case 'diagonal-priority':
        return this.generateDiagonalPriorityPositions();
      case 'spiral-out':
        return this.generateSpiralOutPositions();
      case 'zone-based':
        return this.generateZoneBasedPositions();
      case 'random-weighted':
        return this.generateRandomWeightedPositions();
      default:
        return this.generateRandomWeightedPositions();
    }
  }

  // 1. Centro-primeiro: inicia do centro e expande
  private generateCenterFirstPositions(): Position[] {
    const positions: Position[] = [];
    const centerRow = Math.floor(this.context.boardHeight / 2);
    const centerCol = Math.floor(this.context.boardWidth / 2);
    
    // Espiral do centro para fora
    for (let radius = 0; radius < Math.max(this.context.boardHeight, this.context.boardWidth) / 2; radius++) {
      for (let angle = 0; angle < 8; angle++) {
        const deltaRow = Math.round(radius * Math.cos(angle * Math.PI / 4));
        const deltaCol = Math.round(radius * Math.sin(angle * Math.PI / 4));
        
        const row = centerRow + deltaRow;
        const col = centerCol + deltaCol;
        
        if (this.isValidPosition(row, col)) {
          positions.push({ row, col });
        }
      }
    }
    
    return positions;
  }

  // 2. Bordas-primeiro: inicia das bordas e move para centro
  private generateEdgesFirstPositions(): Position[] {
    const positions: Position[] = [];
    
    // Adicionar bordas primeiro
    const edges = [
      // Borda superior e inferior
      ...Array.from({ length: this.context.boardWidth }, (_, col) => [
        { row: 0, col },
        { row: this.context.boardHeight - 1, col }
      ]).flat(),
      // Bordas laterais (excluindo cantos já adicionados)
      ...Array.from({ length: this.context.boardHeight - 2 }, (_, i) => [
        { row: i + 1, col: 0 },
        { row: i + 1, col: this.context.boardWidth - 1 }
      ]).flat()
    ];
    
    // Embaralhar bordas
    positions.push(...this.shuffleArray(edges));
    
    // Adicionar posições internas em camadas
    for (let layer = 1; layer < Math.min(this.context.boardHeight, this.context.boardWidth) / 2; layer++) {
      const layerPositions: Position[] = [];
      
      for (let row = layer; row < this.context.boardHeight - layer; row++) {
        for (let col = layer; col < this.context.boardWidth - layer; col++) {
          // Apenas bordas da camada atual
          if (row === layer || row === this.context.boardHeight - layer - 1 ||
              col === layer || col === this.context.boardWidth - layer - 1) {
            layerPositions.push({ row, col });
          }
        }
      }
      
      positions.push(...this.shuffleArray(layerPositions));
    }
    
    return positions;
  }

  // 3. Prioridade diagonal: favorece posições diagonais
  private generateDiagonalPriorityPositions(): Position[] {
    const positions: Position[] = [];
    
    // Diagonais principais
    const mainDiagonals: Position[] = [];
    const minDim = Math.min(this.context.boardHeight, this.context.boardWidth);
    
    for (let i = 0; i < minDim; i++) {
      mainDiagonals.push({ row: i, col: i }); // Principal
      mainDiagonals.push({ row: i, col: this.context.boardWidth - 1 - i }); // Secundária
    }
    
    positions.push(...this.shuffleArray(mainDiagonals));
    
    // Diagonais paralelas
    for (let offset = 1; offset < Math.max(this.context.boardHeight, this.context.boardWidth); offset++) {
      const parallelDiag: Position[] = [];
      
      // Diagonais paralelas à principal
      for (let row = 0; row < this.context.boardHeight; row++) {
        const col1 = row + offset;
        const col2 = row - offset;
        
        if (col1 < this.context.boardWidth) {
          parallelDiag.push({ row, col: col1 });
        }
        if (col2 >= 0) {
          parallelDiag.push({ row, col: col2 });
        }
      }
      
      positions.push(...this.shuffleArray(parallelDiag));
    }
    
    // Preencher posições restantes
    const remaining: Position[] = [];
    for (let row = 0; row < this.context.boardHeight; row++) {
      for (let col = 0; col < this.context.boardWidth; col++) {
        if (!positions.some(p => p.row === row && p.col === col)) {
          remaining.push({ row, col });
        }
      }
    }
    
    positions.push(...this.shuffleArray(remaining));
    return positions;
  }

  // 4. Espiral para fora: movimento espiral determinístico
  private generateSpiralOutPositions(): Position[] {
    const positions: Position[] = [];
    const visited = Array(this.context.boardHeight).fill(null)
      .map(() => Array(this.context.boardWidth).fill(false));
    
    let row = Math.floor(this.context.boardHeight / 2);
    let col = Math.floor(this.context.boardWidth / 2);
    
    // Direções: direita, baixo, esquerda, cima
    const directions = [
      { row: 0, col: 1 },   // direita
      { row: 1, col: 0 },   // baixo
      { row: 0, col: -1 },  // esquerda
      { row: -1, col: 0 }   // cima
    ];
    
    let dirIndex = 0;
    let steps = 1;
    
    positions.push({ row, col });
    visited[row][col] = true;
    
    while (positions.length < this.context.boardHeight * this.context.boardWidth) {
      for (let i = 0; i < 2; i++) { // Cada número de passos é usado duas vezes
        for (let j = 0; j < steps; j++) {
          row += directions[dirIndex].row;
          col += directions[dirIndex].col;
          
          if (this.isValidPosition(row, col) && !visited[row][col]) {
            positions.push({ row, col });
            visited[row][col] = true;
          }
        }
        dirIndex = (dirIndex + 1) % 4;
      }
      steps++;
    }
    
    return positions;
  }

  // 5. Baseado em zonas: divide tabuleiro em regiões
  private generateZoneBasedPositions(): Position[] {
    const positions: Position[] = [];
    
    // Dividir em 4 zonas (quadrantes)
    const zones = [
      { startRow: 0, endRow: Math.floor(this.context.boardHeight / 2), 
        startCol: 0, endCol: Math.floor(this.context.boardWidth / 2) },
      { startRow: 0, endRow: Math.floor(this.context.boardHeight / 2), 
        startCol: Math.floor(this.context.boardWidth / 2), endCol: this.context.boardWidth },
      { startRow: Math.floor(this.context.boardHeight / 2), endRow: this.context.boardHeight, 
        startCol: 0, endCol: Math.floor(this.context.boardWidth / 2) },
      { startRow: Math.floor(this.context.boardHeight / 2), endRow: this.context.boardHeight, 
        startCol: Math.floor(this.context.boardWidth / 2), endCol: this.context.boardWidth }
    ];
    
    // Embaralhar ordem das zonas
    const shuffledZones = this.shuffleArray(zones);
    
    for (const zone of shuffledZones) {
      const zonePositions: Position[] = [];
      
      for (let row = zone.startRow; row < zone.endRow; row++) {
        for (let col = zone.startCol; col < zone.endCol; col++) {
          zonePositions.push({ row, col });
        }
      }
      
      positions.push(...this.shuffleArray(zonePositions));
    }
    
    return positions;
  }

  // 6. Aleatório com pesos: posições completamente aleatórias mas com bias
  private generateRandomWeightedPositions(): Position[] {
    const positions: Position[] = [];
    
    for (let row = 0; row < this.context.boardHeight; row++) {
      for (let col = 0; col < this.context.boardWidth; col++) {
        positions.push({ row, col });
      }
    }
    
    // Embaralhar completamente mas aplicar pesos baseados no bias
    return positions.sort(() => this.rng() - 0.5);
  }

  private calculateStrategicScore(candidate: PlacementCandidate, word: string): number {
    let score = 0;
    
    // 1. Score baseado na direção (usar pesos da configuração)
    score += this.context.directionWeights[candidate.direction] * 40;
    
    // 2. Score baseado na posição (centro vs bordas)
    const centerDistance = this.calculateCenterDistance(candidate.row, candidate.col);
    const normalizedDistance = centerDistance / Math.max(this.context.boardHeight, this.context.boardWidth);
    
    const centerScore = (1 - normalizedDistance) * this.context.positionBias.centerWeight;
    const borderScore = normalizedDistance * this.context.positionBias.borderWeight;
    score += (centerScore + borderScore) * 30;
    
    // 3. Score de separação (evitar sobreposição)
    score += this.calculateSeparationScore(candidate.positions) * 20;
    
    // 4. Fator aleatório baseado no bias
    score += this.rng() * this.context.positionBias.randomFactor * 10;
    
    return score;
  }

  private calculateCenterDistance(row: number, col: number): number {
    const centerRow = this.context.boardHeight / 2;
    const centerCol = this.context.boardWidth / 2;
    
    return Math.sqrt(Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2));
  }

  private calculateSeparationScore(positions: Position[]): number {
    let minDistance = Infinity;
    
    for (const placedWord of this.context.placedWords) {
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

  private isValidPlacement(positions: Position[]): boolean {
    return positions.every(pos => this.isValidPosition(pos.row, pos.col));
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.context.boardHeight && 
           col >= 0 && col < this.context.boardWidth;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private createSeededRandom(seed: number): () => number {
    let current = seed % 2147483647;
    if (current <= 0) current += 2147483646;
    
    return () => {
      current = (current * 16807) % 2147483647;
      return (current - 1) / 2147483646;
    };
  }
}

export { StrategicPlacer, type PlacementCandidate, type PlacementContext };