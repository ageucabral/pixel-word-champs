
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Utilitários para trabalhar com horário de Brasília (UTC-3)
 */

const BRASILIA_TIMEZONE = 'America/Sao_Paulo';

export const getBrasiliaTime = (): Date => {
  // Obter o horário atual no fuso de Brasília
  const now = new Date();
  const brasiliaTime = toZonedTime(now, BRASILIA_TIMEZONE);
  
  console.log('🕐 Horário UTC:', now.toISOString());
  console.log('🇧🇷 Horário Brasília calculado:', brasiliaTime.toISOString());
  
  return brasiliaTime;
};

export const convertToBrasiliaTime = (date: Date): Date => {
  // Converter uma data UTC para o horário de Brasília
  return toZonedTime(date, BRASILIA_TIMEZONE);
};

export const convertFromBrasiliaTime = (date: Date): Date => {
  // Converter uma data de Brasília para UTC
  return fromZonedTime(date, BRASILIA_TIMEZONE);
};

export const isDateInCurrentBrasiliaRange = (startDate: Date, endDate: Date): boolean => {
  const brasiliaNow = getBrasiliaTime();
  const brasiliaStart = convertToBrasiliaTime(startDate);
  const brasiliaEnd = convertToBrasiliaTime(endDate);
  
  console.log('🔍 Verificando período ativo:');
  console.log('  📅 Início (Brasília):', brasiliaStart.toISOString());
  console.log('  📅 Fim (Brasília):', brasiliaEnd.toISOString());
  console.log('  🕐 Agora (Brasília):', brasiliaNow.toISOString());
  
  const isActive = brasiliaNow >= brasiliaStart && brasiliaNow <= brasiliaEnd;
  console.log('  ✅ Ativo:', isActive);
  
  return isActive;
};

export const isBrasiliaDateInFuture = (date: Date): boolean => {
  const brasiliaNow = getBrasiliaTime();
  const brasiliaDate = convertToBrasiliaTime(date);
  
  console.log('🔍 Verificando se data é futura:');
  console.log('  📅 Data (Brasília):', brasiliaDate.toISOString());
  console.log('  🕐 Agora (Brasília):', brasiliaNow.toISOString());
  
  const isFuture = brasiliaDate > brasiliaNow;
  console.log('  ➡️ É futura:', isFuture);
  
  return isFuture;
};

// Função para verificar se uma competição está ativa considerando Brasília
export const isCompetitionActiveInBrasilia = (startDate: Date, endDate: Date): boolean => {
  const brasiliaNow = getBrasiliaTime();
  
  console.log('🔍 Verificando competição no horário de Brasília:');
  console.log('  📅 Início UTC:', startDate.toISOString());
  console.log('  📅 Fim UTC:', endDate.toISOString());
  console.log('  🕐 Agora Brasília:', brasiliaNow.toISOString());
  
  // Converter as datas UTC para o contexto de Brasília
  const startDateBrasilia = convertToBrasiliaTime(startDate);
  const endDateBrasilia = convertToBrasiliaTime(endDate);
  
  console.log('  📅 Início Brasília:', startDateBrasilia.toISOString());
  console.log('  📅 Fim Brasília:', endDateBrasilia.toISOString());
  
  const isActive = brasiliaNow >= startDateBrasilia && brasiliaNow <= endDateBrasilia;
  console.log('  ✅ Ativo:', isActive);
  
  return isActive;
};

// Função para verificar se estamos no mesmo dia em Brasília
export const isSameDayInBrasilia = (date1: Date, date2: Date): boolean => {
  const brasilia1 = convertToBrasiliaTime(date1);
  const brasilia2 = convertToBrasiliaTime(date2);
  
  return brasilia1.toDateString() === brasilia2.toDateString();
};

// Função para obter o início do dia em Brasília
export const getStartOfDayInBrasilia = (date: Date): Date => {
  const brasiliaDate = convertToBrasiliaTime(date);
  brasiliaDate.setHours(0, 0, 0, 0);
  return brasiliaDate;
};

// Função para obter o fim do dia em Brasília
export const getEndOfDayInBrasilia = (date: Date): Date => {
  const brasiliaDate = convertToBrasiliaTime(date);
  brasiliaDate.setHours(23, 59, 59, 999);
  return brasiliaDate;
};

// Função para formatar data no horário de Brasília
export const formatBrasiliaTime = (date: Date, format: string = 'yyyy-MM-dd HH:mm:ss'): string => {
  return formatInTimeZone(date, BRASILIA_TIMEZONE, format);
};
