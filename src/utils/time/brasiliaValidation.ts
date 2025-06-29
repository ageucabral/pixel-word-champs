
/**
 * VALIDAÇÕES DE DATA E HORA
 * Funções para validar períodos, durações e ranges
 */

/**
 * CORRIGIDO: Validação com formato datetime-local correto
 */
export const validateCompetitionDuration = (startDateTimeBrasilia: string, durationHours: number): { isValid: boolean; error?: string } => {
  if (!startDateTimeBrasilia) {
    return { isValid: false, error: 'Data de início é obrigatória' };
  }
  
  if (!durationHours || durationHours < 1) {
    return { isValid: false, error: 'Duração deve ser de pelo menos 1 hora' };
  }
  
  if (durationHours > 12) {
    return { isValid: false, error: 'Duração máxima é de 12 horas' };
  }
  
  try {
    console.log('🔍 Validação CORRIGIDA:', {
      input: startDateTimeBrasilia,
      inputType: typeof startDateTimeBrasilia,
      duration: durationHours,
      isDatetimeLocal: startDateTimeBrasilia.includes('T')
    });
    
    // CORREÇÃO: Verificar se é formato datetime-local (YYYY-MM-DDTHH:mm)
    let startDate: Date;
    
    if (startDateTimeBrasilia.includes('T')) {
      // Formato datetime-local: YYYY-MM-DDTHH:mm
      startDate = new Date(startDateTimeBrasilia);
      console.log('📅 Parsing formato datetime-local:', {
        original: startDateTimeBrasilia,
        parsed: startDate.toISOString(),
        isValid: !isNaN(startDate.getTime())
      });
    } else {
      // Fallback para outros formatos (não deveria acontecer com datetime-local)
      startDate = new Date(startDateTimeBrasilia);
      console.log('📅 Parsing formato alternativo:', {
        original: startDateTimeBrasilia,
        parsed: startDate.toISOString(),
        isValid: !isNaN(startDate.getTime())
      });
    }
    
    if (isNaN(startDate.getTime())) {
      console.error('❌ Data inválida:', {
        input: startDateTimeBrasilia,
        parsedTime: startDate.getTime()
      });
      return { isValid: false, error: 'Data de início inválida - formato não reconhecido' };
    }
    
    const endDate = new Date(startDate.getTime() + (durationHours * 60 * 60 * 1000));
    
    // Limite do mesmo dia (23:59:59)
    const sameDayLimit = new Date(startDate);
    sameDayLimit.setHours(23, 59, 59, 999);
    
    console.log('🔍 Validação de duração:', {
      startTime: startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      endTime: endDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      limit: sameDayLimit.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      willExceed: endDate > sameDayLimit,
      duration: durationHours,
      startDateInput: startDateTimeBrasilia
    });
    
    if (endDate > sameDayLimit) {
      const maxDurationMs = sameDayLimit.getTime() - startDate.getTime();
      const maxDurationHours = Math.floor(maxDurationMs / (60 * 60 * 1000));
      
      return { 
        isValid: false, 
        error: `Duração máxima para este horário é de ${maxDurationHours} horas (até 23:59 do mesmo dia)` 
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('❌ Erro na validação de duração:', {
      error: error.message,
      input: startDateTimeBrasilia,
      duration: durationHours
    });
    return { isValid: false, error: 'Erro na validação da duração: ' + error.message };
  }
};

/**
 * Validar range de datas Brasília
 */
export const validateBrasiliaDateRange = (startDate: string, endDate: string): { isValid: boolean; error?: string } => {
  if (!startDate || !endDate) {
    return { isValid: false, error: 'Datas de início e fim são obrigatórias' };
  }
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, error: 'Formato de data inválido' };
    }
    
    if (start >= end) {
      return { isValid: false, error: 'Data de início deve ser anterior à data de fim' };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('❌ Erro na validação de range:', error);
    return { isValid: false, error: 'Datas inválidas: ' + error.message };
  }
};
