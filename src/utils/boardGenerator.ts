
import { SmartWordDistributionService } from '@/services/smartWordDistributionService';
import { type Position, getBoardWidth, getMobileBoardWidth } from '@/utils/boardUtils';
import { isValidGameWord, normalizeText } from '@/utils/levelConfiguration';
import { LevelBasedGenerator } from '@/utils/levelBasedGeneration';
import { AdvancedShuffler } from '@/utils/advancedShuffling';
import { logger } from '@/utils/logger';

export interface WordPlacementResult {
  board: string[][];
  placedWords: Array<{
    word: string;
    startRow: number;
    startCol: number;
    direction: 'horizontal' | 'vertical' | 'diagonal';
    positions: Position[];
  }>;
}

export class BoardGenerator {
  static generateSmartBoard(height: number, words: string[], level: number = 1): WordPlacementResult {
    const width = 12; // largura fixa agora é 12
    
    // ✨ NOVO: Gerar configuração baseada no nível
    const levelConfig = LevelBasedGenerator.generateLevelConfig(level);
    
    logger.info(`🚀 Iniciando geração do tabuleiro ${height}x${width} NÍVEL ${level}`, {
      words: words.slice(0, 3),
      totalWords: words.length,
      strategy: levelConfig.strategy,
      shuffleMethod: levelConfig.shuffleMethod,
      seed: levelConfig.seed.toString(16).substring(0, 8)
    }, 'BOARD_GENERATION');
    
    // Normalizar e validar palavras
    const normalizedWords = words
      .map(word => normalizeText(word))
      .filter(word => {
        const isValid = isValidGameWord(word, Math.max(height, width));
        if (!isValid) {
          logger.warn(`⚠️ Palavra "${word}" rejeitada na validação`);
        }
        return isValid;
      });
    
    if (normalizedWords.length === 0) {
      logger.error(`❌ CRÍTICO: Nenhuma palavra válida para tabuleiro ${height}x${width} nível ${level}`);
      
      // Gerar tabuleiro vazio mas funcional com seed do nível
      const emptyBoard = this.generateSeededEmptyBoard(height, width, levelConfig.seed);
      
      return {
        board: emptyBoard,
        placedWords: []
      };
    }
    
    // ✨ NOVO: Usar embaralhamento avançado baseado no nível
    const shuffler = new AdvancedShuffler(levelConfig.seed);
    const shuffleResult = shuffler.shuffle(normalizedWords, levelConfig.shuffleMethod);
    
    logger.info(`🔀 Palavras embaralhadas para nível ${level}`, {
      method: shuffleResult.method,
      entropy: shuffleResult.entropy.toFixed(2),
      wordsCount: shuffleResult.shuffled.length
    }, 'BOARD_GENERATION');
    
    // ✨ NOVO: Usar serviço de distribuição com configuração do nível
    const distributionService = new SmartWordDistributionService(
      height, 
      width, 
      levelConfig
    );
    const result = distributionService.distributeWords(shuffleResult.shuffled);
    
    // Validar e analisar resultado
    if (result.placedWords.length === 0) {
      logger.error(`❌ ERRO: Nenhuma palavra foi colocada no tabuleiro ${height}x${width} nível ${level}`);
    } else {
      logger.info(`✅ Tabuleiro NÍVEL ${level} gerado com sucesso`, {
        placedWords: result.placedWords.length,
        totalWords: normalizedWords.length,
        strategy: levelConfig.strategy,
        successRate: `${((result.placedWords.length / normalizedWords.length) * 100).toFixed(1)}%`
      }, 'BOARD_GENERATION');
      
      // Log da distribuição final
      const distribution = this.analyzeDistribution(result.placedWords);
      logger.debug(`📊 Distribuição final nível ${level}:`, distribution, 'BOARD_GENERATION');
    }
    
    return result;
  }

  // ✨ NOVO: Gerar tabuleiro vazio com seed para consistência
  private static generateSeededEmptyBoard(height: number, width: number, seed: number): string[][] {
    const rng = this.createSeededRandom(seed);
    
    return Array(height).fill(null).map(() => 
      Array(width).fill(null).map(() => 
        String.fromCharCode(65 + Math.floor(rng() * 26))
      )
    );
  }

  // ✨ NOVO: Gerador de números pseudoaleatórios com seed
  private static createSeededRandom(seed: number): () => number {
    let current = seed % 2147483647;
    if (current <= 0) current += 2147483646;
    
    return () => {
      current = (current * 16807) % 2147483647;
      return (current - 1) / 2147483646;
    };
  }

  private static analyzeDistribution(placedWords: Array<{ direction: string }>): object {
    const distribution = {
      horizontal: 0,
      vertical: 0,
      diagonal: 0,
      total: placedWords.length
    };

    for (const word of placedWords) {
      if (word.direction in distribution) {
        (distribution as any)[word.direction]++;
      }
    }

    return {
      ...distribution,
      percentages: {
        horizontal: ((distribution.horizontal / distribution.total) * 100).toFixed(1) + '%',
        vertical: ((distribution.vertical / distribution.total) * 100).toFixed(1) + '%',
        diagonal: ((distribution.diagonal / distribution.total) * 100).toFixed(1) + '%'
      }
    };
  }
}
