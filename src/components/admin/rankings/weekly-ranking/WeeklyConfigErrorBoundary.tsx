
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface WeeklyConfigErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

interface WeeklyConfigErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WeeklyConfigErrorBoundary extends React.Component<
  WeeklyConfigErrorBoundaryProps,
  WeeklyConfigErrorBoundaryState
> {
  constructor(props: WeeklyConfigErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WeeklyConfigErrorBoundaryState {
    logger.error('❌ WeeklyConfigErrorBoundary capturou erro:', {
      error: error.message,
      stack: error.stack,
      timestamp: getCurrentBrasiliaTime()
    }, 'WEEKLY_CONFIG_ERROR_BOUNDARY');
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('❌ WeeklyConfigErrorBoundary - detalhes do erro:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      timestamp: getCurrentBrasiliaTime()
    }, 'WEEKLY_CONFIG_ERROR_BOUNDARY');
  }

  handleRetry = () => {
    logger.info('🔄 WeeklyConfigErrorBoundary - tentando novamente...', {
      timestamp: getCurrentBrasiliaTime()
    }, 'WEEKLY_CONFIG_ERROR_BOUNDARY');
    
    this.setState({ hasError: false, error: null });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-red-600" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-red-900">
              Erro no Modal de Configuração Semanal
            </h3>
            <p className="text-sm text-red-700">
              Ocorreu um erro ao carregar o modal de configuração semanal.
            </p>
            {this.state.error && (
              <details className="text-xs text-red-600 mt-2">
                <summary className="cursor-pointer font-medium">Detalhes do erro</summary>
                <pre className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-left overflow-auto max-w-md">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
          <Button onClick={this.handleRetry} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
