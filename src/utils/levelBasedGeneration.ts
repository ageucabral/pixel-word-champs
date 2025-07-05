// Sistema de geração de tabuleiro baseado em nível com seeds determinísticas
// Garante variação máxima entre os 20 níveis da competição

import { logger } from '@/utils/logger';

export interface LevelConfig {
  level: number;
  seed: number;
  strategy: PlacementStrategy;
  shuffleMethod: ShuffleMethod;
  directionWeights: DirectionWeights;
  positionBias: PositionBias;
}

export type PlacementStrategy = 
  | 'center-first'      // Começar do centro
  | 'edges-first'       // Começar das bordas  
  | 'diagonal-priority' // Priorizar diagonais
  | 'spiral-out'        // Espiral de dentro para fora
  | 'zone-based'        // Dividir em zonas
  | 'random-weighted';  // Aleatório com pesos

export type ShuffleMethod = 
  | 'fisher-yates'      // Embaralhamento clássico
  | 'rotational'        // Rotação baseada em nível
  | 'segmented'         // Embaralhar por segmentos
  | 'weighted-random'   // Aleatório com pesos por tamanho
  | 'pattern-based';    // Baseado em padrões determinísticos

export interface DirectionWeights {
  horizontal: number;
  vertical: number;
  diagonal: number;
}

export interface PositionBias {
  centerWeight: number;    // 0-1, peso para centro
  borderWeight: number;    // 0-1, peso para bordas
  randomFactor: number;    // 0-1, fator de aleatoriedade
}

class LevelBasedGenerator {
  private static readonly LEVEL_CYCLE = 20; // Ciclo de 20 níveis únicos
  
  // Configurações base para cada estratégia
  private static readonly STRATEGY_CONFIGS: Record<PlacementStrategy, Partial<LevelConfig>> = {
    'center-first': {
      directionWeights: { horizontal: 0.4, vertical: 0.4, diagonal: 0.2 },
      positionBias: { centerWeight: 0.8, borderWeight: 0.1, randomFactor: 0.1 }
    },
    'edges-first': {
      directionWeights: { horizontal: 0.5, vertical: 0.3, diagonal: 0.2 },
      positionBias: { centerWeight: 0.1, borderWeight: 0.8, randomFactor: 0.1 }
    },
    'diagonal-priority': {
      directionWeights: { horizontal: 0.2, vertical: 0.2, diagonal: 0.6 },
      positionBias: { centerWeight: 0.5, borderWeight: 0.3, randomFactor: 0.2 }
    },
    'spiral-out': {
      directionWeights: { horizontal: 0.3, vertical: 0.3, diagonal: 0.4 },
      positionBias: { centerWeight: 0.9, borderWeight: 0.05, randomFactor: 0.05 }
    },
    'zone-based': {
      directionWeights: { horizontal: 0.35, vertical: 0.35, diagonal: 0.3 },
      positionBias: { centerWeight: 0.4, borderWeight: 0.4, randomFactor: 0.2 }
    },
    'random-weighted': {
      directionWeights: { horizontal: 0.33, vertical: 0.33, diagonal: 0.34 },
      positionBias: { centerWeight: 0.3, borderWeight: 0.3, randomFactor: 0.4 }
    }
  };

  // Matriz de estratégias para máxima variação nos 20 níveis
  private static readonly LEVEL_STRATEGIES: PlacementStrategy[] = [
    'center-first',      // Nível 1
    'edges-first',       // Nível 2  
    'diagonal-priority', // Nível 3
    'spiral-out',        // Nível 4
    'zone-based',        // Nível 5
    'random-weighted',   // Nível 6
    'center-first',      // Nível 7 (variação diferente)
    'edges-first',       // Nível 8
    'diagonal-priority', // Nível 9
    'spiral-out',        // Nível 10
    'zone-based',        // Nível 11
    'random-weighted',   // Nível 12
    'center-first',      // Nível 13
    'edges-first',       // Nível 14
    'diagonal-priority', // Nível 15
    'spiral-out',        // Nível 16
    'zone-based',        // Nível 17
    'random-weighted',   // Nível 18
    'center-first',      // Nível 19
    'edges-first'        // Nível 20
  ];

  private static readonly SHUFFLE_METHODS: ShuffleMethod[] = [
    'fisher-yates', 'rotational', 'segmented', 'weighted-random', 'pattern-based'
  ];

  public static generateLevelConfig(level: number): LevelConfig {
    const normalizedLevel = ((level - 1) % this.LEVEL_CYCLE); // 0-19
    
    // Seed determinística baseada no nível com variação suficiente
    const seed = this.generateLevelSeed(level);
    
    // Selecionar estratégia baseada no nível
    const strategy = this.LEVEL_STRATEGIES[normalizedLevel];
    
    // Selecionar método de embaralhamento (rotaciona a cada 4 níveis)
    const shuffleMethod = this.SHUFFLE_METHODS[Math.floor(normalizedLevel / 4)];
    
    // Obter configuração base da estratégia
    const baseConfig = this.STRATEGY_CONFIGS[strategy];
    
    // Adicionar variação baseada no nível para evitar repetição exata
    const levelVariation = this.generateLevelVariation(level, seed);
    
    const config: LevelConfig = {
      level,
      seed,
      strategy,
      shuffleMethod,
      directionWeights: {
        horizontal: this.applyVariation(baseConfig.directionWeights!.horizontal, levelVariation.directionFactor),
        vertical: this.applyVariation(baseConfig.directionWeights!.vertical, levelVariation.directionFactor),
        diagonal: this.applyVariation(baseConfig.directionWeights!.diagonal, levelVariation.directionFactor)
      },
      positionBias: {
        centerWeight: this.applyVariation(baseConfig.positionBias!.centerWeight, levelVariation.positionFactor),
        borderWeight: this.applyVariation(baseConfig.positionBias!.borderWeight, levelVariation.positionFactor),
        randomFactor: this.applyVariation(baseConfig.positionBias!.randomFactor, levelVariation.randomnessFactor)
      }
    };

    logger.info('📋 Configuração gerada para nível', { 
      level, 
      strategy, 
      shuffleMethod,
      seed: seed.toString(16).substring(0, 8)
    }, 'LEVEL_GENERATION');

    return config;
  }

  private static generateLevelSeed(level: number): number {
    // Usar multiplicadores primos para máxima dispersão
    const base = level * 31 + 17;
    const variation = (level * 37 + 23) * (level * 41 + 29);
    
    // Combinar com timestamp do dia para balancear determinismo/variação
    const today = new Date();
    const dayFactor = today.getDate() + (today.getMonth() + 1) * 32;
    
    return (base * variation + dayFactor) % 2147483647; // Max int32
  }

  private static generateLevelVariation(level: number, seed: number) {
    // Usar seed para gerar variações determinísticas mas únicas por nível
    const rng = this.createSeededRandom(seed + level);
    
    return {
      directionFactor: (rng() - 0.5) * 0.2,  // ±10% variação nas direções
      positionFactor: (rng() - 0.5) * 0.15,  // ±7.5% variação nas posições  
      randomnessFactor: (rng() - 0.5) * 0.1  // ±5% variação na aleatoriedade
    };
  }

  private static applyVariation(baseValue: number, variation: number): number {
    const result = Math.max(0, Math.min(1, baseValue + variation));
    return Math.round(result * 100) / 100; // Arredondar para 2 casas decimais
  }

  // Gerador de números pseudoaleatórios com seed (algoritmo LCG simples)
  private static createSeededRandom(seed: number): () => number {
    let current = seed % 2147483647;
    if (current <= 0) current += 2147483646;
    
    return () => {
      current = (current * 16807) % 2147483647;
      return (current - 1) / 2147483646;
    };
  }

  // Método para analisar diversidade entre níveis (para debugging)
  public static analyzeLevelDiversity(levels: number[]): object {
    const configs = levels.map(level => this.generateLevelConfig(level));
    
    const strategies = configs.map(c => c.strategy);
    const shuffleMethods = configs.map(c => c.shuffleMethod);
    
    const strategyDistribution = strategies.reduce((acc, strategy) => {
      acc[strategy] = (acc[strategy] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const shuffleDistribution = shuffleMethods.reduce((acc, method) => {
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLevels: levels.length,
      uniqueStrategies: Object.keys(strategyDistribution).length,
      uniqueShuffleMethods: Object.keys(shuffleDistribution).length,
      strategyDistribution,
      shuffleDistribution,
      seedRange: {
        min: Math.min(...configs.map(c => c.seed)),
        max: Math.max(...configs.map(c => c.seed))
      }
    };
  }
}

export { LevelBasedGenerator };