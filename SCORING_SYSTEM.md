# Sistema de Pontuação e XP - Documentação Oficial

## ✅ PADRONIZAÇÃO COMPLETA IMPLEMENTADA

Este documento define o sistema unificado de pontuação e experiência (XP) do jogo.

## 🎯 Campos e Responsabilidades

### `total_score` (Pontos Temporários)
- **Propósito**: Pontos para competições e rankings semanais
- **Características**: Resetável semanalmente
- **Uso**: Rankings, competições, premiações
- **Fonte**: Soma dos pontos de todas as sessões de jogo

### `experience_points` (XP Permanente)
- **Propósito**: XP permanente para sistema de níveis do jogador
- **Características**: NUNCA resetado
- **Uso**: Cálculo de níveis via `usePlayerLevel`
- **Fonte**: Acumulação 1:1 com pontos de jogo

### `games_played` (Contador de Jogos)
- **Propósito**: Contador total de jogos completados
- **Características**: Incrementado a cada jogo
- **Uso**: Estatísticas do perfil

## 🏗️ Sistema de Níveis - UNIFICADO

### Hook Principal: `usePlayerLevel`
```typescript
const { currentLevel, nextLevel, progress } = usePlayerLevel(totalXP);
```

- **20 níveis**: Sistema exponencial complexo
- **Fonte de dados**: `experience_points` APENAS
- **Progressão**: Exponencial com títulos únicos
- **Uso**: Único sistema oficial de níveis

### ❌ Sistemas Removidos
- `gameScoreService.calculateUserLevel()` - REMOVIDO
- `gameScoreService.calculateLevelProgress()` - REMOVIDO
- Cálculos manuais de nível no OptimizedHomeScreen - CORRIGIDO

## 🔧 Funções RPC - SIMPLIFICADAS

### ✅ Função Principal: `update_user_scores`
```sql
update_user_scores(p_user_id, p_game_points, p_experience_points)
```
- **Única função oficial** para atualizar pontuações
- Atualiza `total_score`, `experience_points` e `games_played`
- Usa expressões SQL seguras

### ❌ Funções Removidas
- `update_user_score_simple` - REMOVIDA (redundante)
- `test_scoring_functions` - REMOVIDA (desnecessária)

## 📊 Fluxo de Pontuação

1. **Jogo Completo** → `gameScoreService.updateGameScore()`
2. **RPC** → `update_user_scores()` atualiza todos os campos
3. **Ranking** → usa `total_score`
4. **Níveis** → usa `experience_points` via `usePlayerLevel`

## 🎮 Implementação nos Componentes

### ✅ Correto
```typescript
// Para níveis
const { currentLevel } = usePlayerLevel(profile?.experience_points || 0);

// Para rankings e pontos
const totalScore = stats?.totalScore || 0;
```

### ❌ Incorreto (corrigido)
```typescript
// NÃO usar mais
Math.floor(totalXP / 1000) + 1
gameScoreService.calculateUserLevel()
```

## 🔍 Estado Atual - TODAS INCONSISTÊNCIAS CORRIGIDAS

- ✅ OptimizedHomeScreen: Usa `usePlayerLevel` apenas
- ✅ XPProgressSection: Corrigido para usar `usePlayerLevel`
- ✅ gameScoreService: Funções redundantes removidas
- ✅ RPC: Apenas `update_user_scores` mantida
- ✅ ProfileStatsGrid: XP removido para evitar confusão

## 📝 Diretrizes para Desenvolvimento

1. **Níveis**: SEMPRE usar `usePlayerLevel(experience_points)`
2. **Rankings**: SEMPRE usar `total_score`
3. **Pontuação**: SEMPRE usar `gameScoreService.updateGameScore()`
4. **RPC**: APENAS `update_user_scores`

## 🎯 Resultado da Padronização

- **2 campos**: Papéis claros e distintos
- **1 sistema de níveis**: `usePlayerLevel` unificado
- **1 função RPC**: `update_user_scores` completa
- **0 inconsistências**: Sistema totalmente padronizado

---

**Status**: ✅ IMPLEMENTADO E FUNCIONAL
**Próximos passos**: Usar sempre esta documentação como referência oficial