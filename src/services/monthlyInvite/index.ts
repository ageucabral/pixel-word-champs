
import { MonthlyInviteCoreService } from './monthlyInviteCore';
import { MonthlyInviteCompetitionService } from './monthlyInviteCompetition';
import { MonthlyInviteStatsService } from './monthlyInviteStats';
import { MonthlyInvitePrizesService } from './monthlyInvitePrizes';
import { MonthlyInviteUnifiedService } from './monthlyInviteUnified';

class MonthlyInviteService {
  private coreService = new MonthlyInviteCoreService();
  private competitionService = new MonthlyInviteCompetitionService();
  private statsService = new MonthlyInviteStatsService();
  private prizesService = new MonthlyInvitePrizesService();
  private unifiedService = new MonthlyInviteUnifiedService();

  // Métodos do unified service (recomendado para novos usos)
  async getMonthlyStats(monthYear?: string) {
    return this.unifiedService.getMonthlyStats(monthYear);
  }

  async refreshMonthlyRanking(monthYear?: string) {
    return this.unifiedService.refreshMonthlyRanking(monthYear);
  }

  // Métodos do core service (manter para compatibilidade)
  getCurrentMonth() {
    return this.coreService.getCurrentMonth();
  }

  async getUserMonthlyPoints(userId?: string, monthYear?: string) {
    return this.coreService.getUserMonthlyPoints(userId, monthYear);
  }

  async getUserMonthlyPosition(userId?: string, monthYear?: string) {
    return this.coreService.getUserMonthlyPosition(userId, monthYear);
  }

  // Métodos do competition service (manter para compatibilidade)
  async getCurrentMonthCompetition() {
    return this.competitionService.getCurrentMonthCompetition();
  }

  async getMonthlyRanking(monthYear?: string, limit = 100) {
    return this.competitionService.getMonthlyRanking(monthYear, limit);
  }

  // Métodos do stats service (manter para compatibilidade)
  async getMonthlyStatsLegacy(monthYear?: string) {
    return this.statsService.getMonthlyStats(monthYear);
  }

  // Métodos do prizes service
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
