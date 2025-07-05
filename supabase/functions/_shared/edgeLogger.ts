/**
 * SISTEMA DE LOGGING PARA EDGE FUNCTIONS - ETAPA 2
 * 
 * Logger otimizado e seguro para execução serverless
 * Remove dados sensíveis automaticamente
 */

interface EdgeLogData {
  context?: string;
  operation?: string;
  success?: boolean;
  hasError?: boolean;
  userId?: string;
  [key: string]: any;
}

class EdgeLogger {
  private sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'email', 'phone', 'cpf', 'cnpj', 'pix', 'card', 'credit',
    'access_token', 'refresh_token', 'session', 'authorization',
    'userid', 'user_id', 'id', 'targetuserid', 'adminpassword'
  ];

  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return `[Array: ${data.length} items]`;
    }

    try {
      const keys = Object.keys(data);
      const maskedCount = keys.filter(key => this.isSensitiveField(key)).length;
      
      const masked: any = {};
      for (const key of keys.slice(0, 5)) { // Apenas primeiras 5 propriedades
        if (this.isSensitiveField(key)) {
          masked[key] = '***';
        } else if (typeof data[key] === 'object') {
          masked[key] = '[Object]';
        } else {
          masked[key] = data[key];
        }
      }
      
      if (keys.length > 5) {
        masked['...'] = `and ${keys.length - 5} more properties`;
      }
      
      if (maskedCount > 0) {
        masked['_maskedFields'] = maskedCount;
      }
      
      return masked;
    } catch {
      return '[Masked Object]';
    }
  }

  private isSensitiveField(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.sensitiveFields.some(field => 
      lowerKey.includes(field) || lowerKey.endsWith('_key') || lowerKey.endsWith('_token')
    );
  }

  private formatMessage(level: string, message: string, data?: EdgeLogData, context?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: context || data?.context || 'EDGE_FUNCTION',
      message,
      data: data ? this.maskSensitiveData(data) : undefined
    };

    // Em edge functions, usar console é necessário mas de forma estruturada
    const logPrefix = `[${level}] ${logEntry.context}: ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logPrefix, logEntry.data || '');
        break;
      case 'WARN':
        console.warn(logPrefix, logEntry.data || '');
        break;
      case 'INFO':
        console.info(logPrefix, logEntry.data || '');
        break;
      case 'DEBUG':
        console.log(logPrefix, logEntry.data || '');
        break;
      case 'SECURITY':
        console.warn(`🔒 [SECURITY] ${logEntry.context}: ${message}`, logEntry.data || '');
        break;
      default:
        console.log(logPrefix, logEntry.data || '');
    }
  }

  info(message: string, data?: EdgeLogData, context?: string): void {
    this.formatMessage('INFO', message, data, context);
  }

  error(message: string, data?: EdgeLogData, context?: string): void {
    this.formatMessage('ERROR', message, data, context);
  }

  warn(message: string, data?: EdgeLogData, context?: string): void {
    this.formatMessage('WARN', message, data, context);
  }

  debug(message: string, data?: EdgeLogData, context?: string): void {
    this.formatMessage('DEBUG', message, data, context);
  }

  security(message: string, data?: EdgeLogData, context?: string): void {
    this.formatMessage('SECURITY', message, data, context);
  }

  // Método especial para operações críticas
  operation(operation: string, success: boolean, data?: EdgeLogData, context?: string): void {
    const operationData = {
      ...data,
      operation,
      success,
      timestamp: new Date().toISOString()
    };
    
    if (success) {
      this.info(`✅ Operação completada: ${operation}`, operationData, context);
    } else {
      this.error(`❌ Operação falhou: ${operation}`, operationData, context);
    }
  }
}

export const edgeLogger = new EdgeLogger();

// Utilitários para validação de entrada
export const validateInput = {
  required: (value: any, fieldName: string): void => {
    if (!value) {
      throw new Error(`Campo obrigatório: ${fieldName}`);
    }
  },
  
  uuid: (value: string, fieldName: string): void => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error(`Formato inválido para ${fieldName}: deve ser um UUID`);
    }
  },
  
  minLength: (value: string, minLength: number, fieldName: string): void => {
    if (value.length < minLength) {
      throw new Error(`${fieldName} deve ter pelo menos ${minLength} caracteres`);
    }
  }
};

// Utilitário para tratamento de erros padronizado
export const handleEdgeError = (error: any, context: string, operation?: string) => {
  const errorData = {
    hasError: true,
    errorType: error?.constructor?.name || 'UnknownError',
    operation,
    timestamp: new Date().toISOString()
  };
  
  edgeLogger.error(`Erro em ${context}`, errorData, context);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: error?.message || 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};