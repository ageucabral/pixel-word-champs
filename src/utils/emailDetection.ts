// Utilitários para detectar tipos de email

export const isTemporaryEmail = (email: string): boolean => {
  return email.endsWith('@phone.app');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && !isTemporaryEmail(email);
};

export const getEmailType = (email: string): 'temporary' | 'real' => {
  return isTemporaryEmail(email) ? 'temporary' : 'real';
};