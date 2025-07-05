
import { MonthlyInviteUnifiedService } from './monthlyInviteUnified';
import { MonthlyInvitePrizesService } from './monthlyInvitePrizes';
import { MonthlyInviteCoreService } from './monthlyInviteCore';
import { MonthlyInviteCompetitionService } from './monthlyInviteCompetition';

/**
 * SERVIÇO OTIMIZADO DE CONVITES MENSAIS
 * 
 * Simplificado para usar apenas os services necessários
 */
class MonthlyInviteService {
  private unifiedService = new MonthlyInviteUnifiedService();
  private prizesService = new MonthlyInvitePrizesService();
  private coreService = new MonthlyInviteCoreService();
  private competitionService = new MonthlyInviteCompetitionService();

  // Métodos principais otimizados
  async getMonthlyStats(monthYear?: string) {
    return this.unifiedService.getMonthlyStats(monthYear);
  }

  async refreshMonthlyRanking(monthYear?: string) {
    return this.unifiedService.refreshMonthlyRanking(monthYear);
  }

  // Métodos do core service
  async getUserMonthlyPoints(userId?: string, monthYear?: string) {
    return this.coreService.getUserMonthlyPoints(userId, monthYear);
  }

  async getUserMonthlyPosition(userId?: string, monthYear?: string) {
    return this.coreService.getUserMonthlyPosition(userId, monthYear);
  }

  // Métodos da competição
  async getMonthlyRanking(monthYear?: string, limit = 100) {
    return this.competitionService.getMonthlyRanking(monthYear, limit);
  }

  // Métodos de prêmios
  async getMonthlyPrizes(competitionId?: string) {
    return this.prizesService.getMonthlyPrizes(competitionId);
  }

  async updatePrize(prizeId: string, updates: any) {
    return this.prizesService.updatePrize(prizeId, updates);
  }

  async createPrize(competitionId: string, position: number, prizeAmount: number, description?: string) {
    return this.prizesService.createPrize(competitionId, position, prizeAmount, description);
  }

  async deletePrize(prizeId: string) {
    return this.prizesService.deletePrize(prizeId);
  }

  async togglePrizeStatus(prizeId: string, active: boolean) {
    return this.prizesService.togglePrizeStatus(prizeId, active);
  }

  async getCompetitionTotalPrizePool(competitionId: string) {
    return this.prizesService.getCompetitionTotalPrizePool(competitionId);
  }

  async recalculateCompetitionPrizePool(competitionId: string) {
    return this.prizesService.recalculateCompetitionPrizePool(competitionId);
  }
}

export const monthlyInviteService = new MonthlyInviteService();
