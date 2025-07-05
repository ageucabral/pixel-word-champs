// Sistema avançado de embaralhamento com múltiplas estratégias
// Implementa 5 métodos diferentes de embaralhamento baseados no nível

import { ShuffleMethod } from './levelBasedGeneration';
import { logger } from '@/utils/logger';

interface ShuffleResult<T> {
  shuffled: T[];
  method: ShuffleMethod;
  entropy: number; // Medida de aleatoriedade (0-1)
}

class AdvancedShuffler {
  private rng: () => number;

  constructor(seed: number) {
    this.rng = this.createSeededRandom(seed);
  }

  public shuffle<T>(items: T[], method: ShuffleMethod): ShuffleResult<T> {
    const originalLength = items.length;
    let shuffled: T[];
    let entropy: number;

    switch (method) {
      case 'fisher-yates':
        shuffled = this.fisherYatesShuffle([...items]);
        entropy = 0.95; // Alto grau de aleatoriedade
        break;
        
      case 'rotational':
        shuffled = this.rotationalShuffle([...items]);
        entropy = 0.7; // Médio-alto, padrão rotacional
        break;
        
      case 'segmented':
        shuffled = this.segmentedShuffle([...items]);
        entropy = 0.8; // Alto, mas com estrutura
        break;
        
      case 'weighted-random':
        shuffled = this.weightedRandomShuffle([...items]);
        entropy = 0.85; // Alto, favorece certas posições
        break;
        
      case 'pattern-based':
        shuffled = this.patternBasedShuffle([...items]);
        entropy = 0.6; // Médio, seguindo padrões determinísticos
        break;
        
      default:
        shuffled = this.fisherYatesShuffle([...items]);
        entropy = 0.95;
    }

    logger.debug('🔀 Embaralhamento concluído', { 
      method, 
      originalLength, 
      shuffledLength: shuffled.length,
      entropy: entropy.toFixed(2)
    }, 'ADVANCED_SHUFFLING');

    return { shuffled, method, entropy };
  }

  // 1. Fisher-Yates clássico - máxima aleatoriedade
  private fisherYatesShuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  // 2. Embaralhamento rotacional - gira elementos por segmentos
  private rotationalShuffle<T>(items: T[]): T[] {
    if (items.length <= 1) return items;

    const segments = Math.max(2, Math.ceil(items.length / 3));
    const segmentSize = Math.ceil(items.length / segments);
    
    for (let i = 0; i < segments; i++) {
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize, items.length);
      const segment = items.slice(start, end);
      
      // Rotacionar segmento baseado no seed
      const rotation = Math.floor(this.rng() * segment.length);
      const rotated = [...segment.slice(rotation), ...segment.slice(0, rotation)];
      
      // Substituir no array original
      for (let j = 0; j < rotated.length; j++) {
        items[start + j] = rotated[j];
      }
    }
    
    return items;
  }

  // 3. Embaralhamento segmentado - divide em grupos e embaralha cada um
  private segmentedShuffle<T>(items: T[]): T[] {
    if (items.length <= 2) return items;

    // Dividir em 2-4 segmentos baseado no tamanho
    const numSegments = Math.min(4, Math.max(2, Math.floor(items.length / 2)));
    const segmentSize = Math.ceil(items.length / numSegments);
    const result: T[] = [];

    for (let i = 0; i < numSegments; i++) {
      const start = i * segmentSize;
      const end = Math.min(start + segmentSize, items.length);
      const segment = items.slice(start, end);
      
      // Embaralhar cada segmento independentemente
      const shuffledSegment = this.fisherYatesShuffle([...segment]);
      result.push(...shuffledSegment);
    }

    return result;
  }

  // 4. Embaralhamento com peso - favorece certas posições por tamanho da palavra
  private weightedRandomShuffle<T>(items: T[]): T[] {
    interface WeightedItem<T> {
      item: T;
      weight: number;
      originalIndex: number;
    }

    // Calcular pesos baseados no tamanho (se for string) ou posição
    const weighted: WeightedItem<T>[] = items.map((item, index) => {
      let weight: number;
      
      if (typeof item === 'string') {
        // Palavras maiores têm peso ligeiramente maior (vão para frente)
        weight = Math.pow(item.length, 1.2) + this.rng() * 0.5;
      } else {
        // Para outros tipos, usar posição + aleatoriedade
        weight = (items.length - index) * 0.3 + this.rng() * 2;
      }
      
      return { item, weight, originalIndex: index };
    });

    // Ordenar por peso com alguma aleatoriedade
    weighted.sort((a, b) => {
      const weightDiff = b.weight - a.weight;
      const randomFactor = (this.rng() - 0.5) * 0.3; // ±15% de aleatoriedade
      return weightDiff + randomFactor;
    });

    return weighted.map(w => w.item);
  }

  // 5. Embaralhamento baseado em padrões - usa padrões determinísticos
  private patternBasedShuffle<T>(items: T[]): T[] {
    if (items.length <= 1) return items;

    const result: T[] = new Array(items.length);
    const used: boolean[] = new Array(items.length).fill(false);
    
    // Padrões diferentes baseados no comprimento
    const patterns = [
      [0, 2, 4, 1, 3], // Intercalado
      [2, 0, 3, 1, 4], // Centro-primeiro
      [1, 3, 0, 4, 2], // Bordas-primeiro
      [0, 4, 2, 1, 3]  // Alternado
    ];
    
    const patternIndex = Math.floor(this.rng() * patterns.length);
    const pattern = patterns[patternIndex];
    
    let resultIndex = 0;
    
    // Aplicar padrão expandido para arrays de qualquer tamanho
    for (let cycle = 0; cycle < Math.ceil(items.length / pattern.length); cycle++) {
      for (const patternOffset of pattern) {
        const sourceIndex = (cycle * pattern.length + patternOffset) % items.length;
        
        if (!used[sourceIndex] && resultIndex < items.length) {
          result[resultIndex] = items[sourceIndex];
          used[sourceIndex] = true;
          resultIndex++;
        }
      }
    }
    
    // Preencher posições restantes (se houver)
    for (let i = 0; i < items.length && resultIndex < items.length; i++) {
      if (!used[i]) {
        result[resultIndex] = items[i];
        resultIndex++;
      }
    }
    
    return result;
  }

  // Gerador de números pseudoaleatórios com seed
  private createSeededRandom(seed: number): () => number {
    let current = seed % 2147483647;
    if (current <= 0) current += 2147483646;
    
    return () => {
      current = (current * 16807) % 2147483647;
      return (current - 1) / 2147483646;
    };
  }

  // Método para calcular diversidade entre dois arrays
  public static calculateDiversity<T>(array1: T[], array2: T[]): number {
    if (array1.length !== array2.length) return 1;
    
    let differences = 0;
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        differences++;
      }
    }
    
    return differences / array1.length;
  }

  // Análise de entropia real de um array embaralhado
  public static analyzeEntropy<T>(original: T[], shuffled: T[]): number {
    if (original.length !== shuffled.length) return 0;
    
    let positionalChanges = 0;
    let maxDistance = 0;
    
    for (let i = 0; i < original.length; i++) {
      const originalItem = original[i];
      const newIndex = shuffled.findIndex(item => item === originalItem);
      
      if (newIndex !== i) {
        positionalChanges++;
        maxDistance = Math.max(maxDistance, Math.abs(newIndex - i));
      }
    }
    
    // Normalizar baseado no máximo de mudanças possíveis
    const maxPossibleChanges = original.length;
    const maxPossibleDistance = original.length - 1;
    
    const changeRatio = positionalChanges / maxPossibleChanges;
    const distanceRatio = maxDistance / maxPossibleDistance;
    
    return (changeRatio * 0.7 + distanceRatio * 0.3); // Peso maior para mudanças
  }
}

export { AdvancedShuffler, type ShuffleResult };