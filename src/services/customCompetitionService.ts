
import { customCompetitionCoreService } from './customCompetitionCoreService';
import { logger } from '@/utils/logger';

export interface CustomCompetitionData {
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  category?: string;
  weeklyTournamentId?: string;
  prizePool?: number; // Opcional - competições diárias não têm prêmio
  maxParticipants?: number; // Opcional - competições diárias não têm limite
  startDate?: string;
  endDate?: string;
}

class CustomCompetitionService {
  async createCompetition(data: any) {
    logger.info('Criando competição customizada', { 
      title: data.title, 
      type: data.type 
    }, 'CUSTOM_COMPETITION_SERVICE');
    return customCompetitionCoreService.createCompetition(data);
  }

  async getCustomCompetitions() {
    logger.debug('Buscando competições customizadas', undefined, 'CUSTOM_COMPETITION_SERVICE');
    return customCompetitionCoreService.getCustomCompetitions();
  }

  async deleteCompetition(competitionId: string) {
    logger.info('Deletando competição', { competitionId }, 'CUSTOM_COMPETITION_SERVICE');
    return customCompetitionCoreService.deleteCompetition(competitionId);
  }

  async getActiveCompetitions() {
    logger.debug('Buscando competições ativas customizadas', undefined, 'CUSTOM_COMPETITION_SERVICE');
    return customCompetitionCoreService.getActiveCompetitions();
  }

  async createBulkCompetitions(competitions: any[]) {
    logger.info('Criando competições em massa', { 
      count: competitions.length,
      sample: competitions[0]?.title
    }, 'CUSTOM_COMPETITION_SERVICE');
    
    try {
      let created = 0;
      const errors: string[] = [];
      
      for (const competition of competitions) {
        try {
          const result = await this.createCompetition(competition);
          if (result.success) {
            created++;
          } else {
            errors.push(`${competition.title}: ${result.error}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push(`${competition.title}: ${errorMsg}`);
        }
      }
      
      if (errors.length > 0) {
        logger.warn('Alguns erros durante criação em massa', { errors, created }, 'CUSTOM_COMPETITION_SERVICE');
      }
      
      return {
        success: true,
        data: { 
          created, 
          total: competitions.length,
          errors: errors.length > 0 ? errors : undefined 
        }
      };
      
    } catch (error) {
      logger.error('Erro na criação em massa de competições', { error }, 'CUSTOM_COMPETITION_SERVICE');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar competições em massa'
      };
    }
  }
}

export const customCompetitionService = new CustomCompetitionService();
