
import { getBrasiliaTime } from './brasiliaTime';

/**
 * Utilitários para verificação de tempo das competições
 */
export const adjustCompetitionEndTime = (startDate: Date): Date => {
  const correctedEndDate = new Date(startDate);
  correctedEndDate.setUTCHours(23, 59, 59, 999);
  return correctedEndDate;
};

export const isCompetitionActive = (startDate: Date, endDate: Date): boolean => {
  const now = new Date();
  return now >= startDate && now <= endDate;
};

export const logCompetitionVerification = (comp: any, isActive: boolean, now: Date) => {
  console.log(`🔍 Verificando competição "${comp.title}":`, {
    id: comp.id,
    start: new Date(comp.start_date).toISOString(),
    end: new Date(comp.end_date).toISOString(),
    now: now.toISOString(),
    isActive: isActive,
    startTime: new Date(comp.start_date).getTime(),
    endTime: new Date(comp.end_date).getTime(),
    currentTime: now.getTime()
  });
};
