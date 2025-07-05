
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface Props {
  children: React.ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class CompetitionFormErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    logger.error('🚨 ErrorBoundary capturou erro:', { error, timestamp: getCurrentBrasiliaTime() }, 'COMPETITION_FORM_ERROR_BOUNDARY');
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('🚨 Detalhes do erro capturado:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: getCurrentBrasiliaTime()
    }, 'COMPETITION_FORM_ERROR_BOUNDARY');
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    logger.info('🔄 Tentando novamente após erro...', {
      timestamp: getCurrentBrasiliaTime()
    }, 'COMPETITION_FORM_ERROR_BOUNDARY');
    
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Erro no Formulário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Ocorreu um erro ao carregar o formulário de competição.
            </p>
            
            {this.state.error && (
              <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                <strong>Erro:</strong> {this.state.error.message}
              </div>
            )}
            
            <Button 
              onClick={this.handleRetry}
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
