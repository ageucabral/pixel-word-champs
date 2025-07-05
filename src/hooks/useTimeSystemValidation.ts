
import { useState, useEffect } from 'react';
import { 
  convertBrasiliaInputToUTC, 
  formatBrasiliaDate, 
  getCurrentBrasiliaTime,
  formatUTCForDateTimeLocal,
  calculateEndDateWithDuration 
} from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  timestamp: string;
}

export const useTimeSystemValidation = () => {
  const [checks, setChecks] = useState<ValidationCheck[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState<boolean | null>(null);

  const runContinuousValidation = async () => {
    setIsValidating(true);
    const newChecks: ValidationCheck[] = [];
    const timestamp = getCurrentBrasiliaTime();

    logger.info('🔍 VALIDAÇÃO FINAL COM FORMATAÇÃO CORRIGIDA - Iniciando...', { timestamp }, 'USE_TIME_SYSTEM_VALIDATION');

    // Check 1: Conversão crítica DEFINITIVA 23:00 Brasília → 02:00 UTC (próximo dia)
    try {
      const brasiliaTime = '2025-06-26T23:00';
      const utcTime = convertBrasiliaInputToUTC(brasiliaTime);
      const expectedUTC = '2025-06-27T02:00:00.000Z'; // DEFINITIVO: Próximo dia UTC (+3h exato)
      
      newChecks.push({
        name: 'Conversão Crítica DEFINITIVA 23:00 → UTC (+3h)',
        status: utcTime === expectedUTC ? 'pass' : 'fail',
        message: utcTime === expectedUTC 
          ? `✅ PARSING MANUAL CORRETO: ${brasiliaTime} → ${utcTime} (+3h exato)`
          : `❌ ERRO PARSING: Esperado ${expectedUTC}, Atual: ${utcTime}`,
        timestamp
      });
    } catch (error) {
      newChecks.push({
        name: 'Conversão Crítica DEFINITIVA 23:00 → UTC (+3h)',
        status: 'fail',
        message: `❌ Erro no parsing manual: ${error}`,
        timestamp
      });
    }

    // Check 2: Conversão DEFINITIVA 15:30 Brasília → 18:30 UTC (mesmo dia)
    try {
      const brasiliaTime = '2025-06-26T15:30';
      const utcTime = convertBrasiliaInputToUTC(brasiliaTime);
      const expectedUTC = '2025-06-26T18:30:00.000Z'; // DEFINITIVO: Mesmo dia (+3h exato)
      
      newChecks.push({
        name: 'Conversão Padrão DEFINITIVA 15:30 → UTC (+3h)',
        status: utcTime === expectedUTC ? 'pass' : 'fail',
        message: utcTime === expectedUTC 
          ? `✅ PARSING MANUAL CORRETO: ${brasiliaTime} → ${utcTime} (+3h exato)`
          : `❌ ERRO PARSING: Esperado ${expectedUTC}, Atual: ${utcTime}`,
        timestamp
      });
    } catch (error) {
      newChecks.push({
        name: 'Conversão Padrão DEFINITIVA 15:30 → UTC (+3h)',
        status: 'fail',
        message: `❌ Erro no parsing padrão: ${error}`,
        timestamp
      });
    }

    // Check 3: Formatação UTC → Brasília DEFINITIVA (reverso controlado)
    try {
      const utcTime = '2025-06-27T02:00:00.000Z'; // 23:00 Brasília do dia anterior
      const brasiliaDisplay = formatBrasiliaDate(utcTime, true);
      const expectedDisplay = '26/06/2025 23:00:00'; // DEFINITIVO: Dia anterior em Brasília (-3h exato)
      
      newChecks.push({
        name: 'Formatação UTC → Brasília DEFINITIVA (-3h)',
        status: brasiliaDisplay === expectedDisplay ? 'pass' : 'fail',
        message: brasiliaDisplay === expectedDisplay
          ? `✅ CONVERSÃO CONTROLADA CORRETA: UTC ${utcTime} → Brasília ${brasiliaDisplay} (-3h exato)`
          : `❌ ERRO CONVERSÃO: Esperado ${expectedDisplay}, Atual: ${brasiliaDisplay}`,
        timestamp
      });
    } catch (error) {
      newChecks.push({
        name: 'Formatação UTC → Brasília DEFINITIVA (-3h)',
        status: 'fail',
        message: `❌ Erro na formatação reversa: ${error}`,
        timestamp
      });
    }

    // Check 4: Roundtrip crítico DEFINITIVO 23:00 (simetria perfeita)
    try {
      const originalInput = '2025-06-26T23:00';
      const toUTC = convertBrasiliaInputToUTC(originalInput);
      const backToBrasilia = formatUTCForDateTimeLocal(toUTC);
      
      newChecks.push({
        name: 'Roundtrip Crítico DEFINITIVO 23:00 (Simetria)',
        status: originalInput === backToBrasilia ? 'pass' : 'fail',
        message: originalInput === backToBrasilia
          ? `✅ SIMETRIA PERFEITA: ${originalInput} → UTC → ${backToBrasilia} (parsing manual)`
          : `❌ SIMETRIA QUEBRADA: ${originalInput} → ${backToBrasilia} (via ${toUTC})`,
        timestamp
      });
    } catch (error) {
      newChecks.push({
        name: 'Roundtrip Crítico DEFINITIVO 23:00 (Simetria)',
        status: 'fail',
        message: `❌ Erro no roundtrip crítico: ${error}`,
        timestamp
      });
    }

    // Check 5: Cálculo de duração DEFINITIVO com limite preciso
    try {
      const startTime = '2025-06-26T22:00'; // 22:00
      const duration = 3; // +3h = 01:00 (próximo dia) → deve limitar em 23:59
      const endTimeUTC = calculateEndDateWithDuration(startTime, duration);
      const endTimeBrasilia = formatUTCForDateTimeLocal(endTimeUTC);
      
      // DEFINITIVO: Deve limitar em 23:59
      const isWithinLimit = endTimeBrasilia.startsWith('2025-06-26T23:59') || endTimeBrasilia === '2025-06-26T23:59';
      
      newChecks.push({
        name: 'Cálculo com Limite DEFINITIVO (Parsing Manual)',
        status: isWithinLimit ? 'pass' : 'fail',
        message: isWithinLimit
          ? `✅ LIMITE RESPEITADO: ${startTime} + ${duration}h → ${endTimeBrasilia} (parsing manual + limite 23:59)`
          : `❌ LIMITE ULTRAPASSADO: ${startTime} + ${duration}h → ${endTimeBrasilia} (deveria ser 23:59)`,
        timestamp
      });
    } catch (error) {
      newChecks.push({
        name: 'Cálculo com Limite DEFINITIVO (Parsing Manual)',
        status: 'fail',
        message: `❌ Erro no cálculo com parsing manual: ${error}`,
        timestamp
      });
    }

    // Check 6: CORRIGIDO FINAL - Horário atual Brasília (formato garantido)
    try {
      const currentTime = getCurrentBrasiliaTime();
      const isValidFormat = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(currentTime);
      
      logger.debug('🔍 TESTE FINAL getCurrentBrasiliaTime:', {
        currentTime,
        isValidFormat,
        regex: '/^\\d{2}/\\d{2}/\\d{4} \\d{2}:\\d{2}:\\d{2}$/',
        length: currentTime.length,
        charCodes: currentTime.split('').map(c => c.charCodeAt(0))
      }, 'USE_TIME_SYSTEM_VALIDATION');
      
      newChecks.push({
        name: 'Horário Atual Brasília FINAL (Formato Garantido)',
        status: isValidFormat ? 'pass' : 'fail',
        message: isValidFormat
          ? `✅ FORMATO FINAL CORRETO: ${currentTime} (DD/MM/YYYY HH:mm:ss sem vírgula)`
          : `❌ FORMATO INVÁLIDO: "${currentTime}" (esperado DD/MM/YYYY HH:mm:ss)`,
        timestamp
      });
    } catch (error) {
      newChecks.push({
        name: 'Horário Atual Brasília FINAL (Formato Garantido)',
        status: 'fail',
        message: `❌ Erro ao obter horário: ${error}`,
        timestamp
      });
    }

    // Check 7: Teste Edge Case DEFINITIVO - Meia-noite (parsing manual)
    try {
      const midnightInput = '2025-06-26T00:00';
      const midnightUTC = convertBrasiliaInputToUTC(midnightInput);
      const expectedMidnightUTC = '2025-06-26T03:00:00.000Z'; // DEFINITIVO: Mesmo dia UTC (+3h exato)
      
      newChecks.push({
        name: 'Edge Case DEFINITIVO - Meia-noite (Parsing Manual)',
        status: midnightUTC === expectedMidnightUTC ? 'pass' : 'fail',
        message: midnightUTC === expectedMidnightUTC
          ? `✅ PARSING MANUAL CORRETO: Meia-noite ${midnightInput} → ${midnightUTC} (+3h exato)`
          : `❌ ERRO PARSING: Esperado ${expectedMidnightUTC}, Atual: ${midnightUTC}`,
        timestamp
      });
    } catch (error) {
      newChecks.push({
        name: 'Edge Case DEFINITIVO - Meia-noite (Parsing Manual)',
        status: 'fail',
        message: `❌ Erro no edge case meia-noite: ${error}`,
        timestamp
      });
    }

    setChecks(newChecks);
    
    const passedChecks = newChecks.filter(check => check.status === 'pass').length;
    const totalChecks = newChecks.length;
    const healthy = passedChecks === totalChecks;
    
    setSystemHealthy(healthy);
    setIsValidating(false);

    logger.info('📊 VALIDAÇÃO FINAL COM FORMATAÇÃO CORRIGIDA CONCLUÍDA:', {
      timestamp,
      totalChecks,
      passedChecks,
      failedChecks: totalChecks - passedChecks,
      systemHealthy: healthy,
      technique: 'Formatação final corrigida + parsing manual',
      detailedResults: newChecks.map(c => ({
        test: c.name,
        status: c.status,
        message: c.message
      }))
    }, 'USE_TIME_SYSTEM_VALIDATION');

    return {
      healthy,
      passedChecks,
      totalChecks,
      checks: newChecks
    };
  };

  // Executar validação inicial
  useEffect(() => {
    runContinuousValidation();
  }, []);

  return {
    checks,
    isValidating,
    systemHealthy,
    runValidation: runContinuousValidation
  };
};
