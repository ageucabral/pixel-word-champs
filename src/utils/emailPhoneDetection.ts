// Utilitário para detectar e formatar email/telefone automaticamente

export type InputType = 'email' | 'phone' | 'unknown';

export interface FormatResult {
  value: string;
  type: InputType;
  isValid: boolean;
}

// Detecta se o input é email ou telefone
export const detectInputType = (input: string): InputType => {
  if (!input || typeof input !== 'string') return 'unknown';
  
  const trimmed = input.trim();
  
  // Se contém @ é email
  if (trimmed.includes('@')) return 'email';
  
  // Se contém apenas números, parênteses, espaços, hífen ou + é telefone
  if (/^[\d\s\(\)\-\+]+$/.test(trimmed)) return 'phone';
  
  return 'unknown';
};

// Formata telefone brasileiro adicionando +55 automaticamente
export const formatPhoneBR = (phone: string): string => {
  if (!phone) return '';
  
  // Remove tudo exceto números
  const cleaned = phone.replace(/\D/g, '');
  
  // Se já tem código do país (+55), não alterar
  if (phone.startsWith('+55') || phone.startsWith('55')) {
    return phone.startsWith('+') ? phone : `+${phone}`;
  }
  
  // Se tem 11 dígitos (celular) ou 10 dígitos (fixo), adicionar +55
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    // Adicionar +55 e formatar
    const formatted = `+55${cleaned}`;
    return formatted;
  }
  
  // Se tem mais que 11 dígitos, pode já ter código do país
  if (cleaned.length > 11) {
    return phone.startsWith('+') ? phone : `+${cleaned}`;
  }
  
  // Retorna como está se não conseguir identificar padrão
  return phone;
};

// Valida email
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Valida telefone brasileiro
export const validatePhoneBR = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Aceita números brasileiros com ou sem código do país
  // 10 dígitos (fixo): 1133334444
  // 11 dígitos (celular): 11933334444
  // 13 dígitos (com +55): 5511933334444
  return cleaned.length >= 10 && cleaned.length <= 13;
};

// Função principal que detecta, formata e valida
export const processInput = (input: string): FormatResult => {
  const type = detectInputType(input);
  let value = input;
  let isValid = false;
  
  switch (type) {
    case 'email':
      value = input.trim().toLowerCase();
      isValid = validateEmail(value);
      break;
      
    case 'phone':
      value = formatPhoneBR(input);
      isValid = validatePhoneBR(value);
      break;
      
    default:
      value = input;
      isValid = false;
  }
  
  return { value, type, isValid };
};

// Hook personalizado para usar nos formulários
export const useEmailPhoneInput = (initialValue: string = '') => {
  const [inputValue, setInputValue] = React.useState(initialValue);
  const [inputType, setInputType] = React.useState<InputType>('unknown');
  const [isValid, setIsValid] = React.useState(false);
  
  const handleChange = (value: string) => {
    const result = processInput(value);
    setInputValue(result.value);
    setInputType(result.type);
    setIsValid(result.isValid);
    return result;
  };
  
  return {
    value: inputValue,
    type: inputType,
    isValid,
    onChange: handleChange,
    reset: () => {
      setInputValue('');
      setInputType('unknown');
      setIsValid(false);
    }
  };
};

// Importar React apenas se necessário
import React from 'react';