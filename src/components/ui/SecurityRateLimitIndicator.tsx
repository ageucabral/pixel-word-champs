import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Clock, AlertTriangle } from 'lucide-react';
import { useRateLimiting } from '@/hooks/useRateLimiting';

interface SecurityRateLimitIndicatorProps {
  endpoint: string;
  className?: string;
  showDetails?: boolean;
}

export const SecurityRateLimitIndicator: React.FC<SecurityRateLimitIndicatorProps> = ({
  endpoint,
  className = "",
  showDetails = false
}) => {
  const { rateLimitState } = useRateLimiting(endpoint);

  const getMaxAttempts = (endpoint: string): number => {
    const limits: Record<string, number> = {
      login: 5,
      register: 3,
      game: 100,
      admin: 50,
      general: 30,
    };
    return limits[endpoint] || limits.general;
  };

  const maxAttempts = getMaxAttempts(endpoint);
  const usedAttempts = maxAttempts - rateLimitState.remainingAttempts;
  const progressPercentage = (usedAttempts / maxAttempts) * 100;

  const getStatusColor = () => {
    if (rateLimitState.isLimited) return 'text-red-600';
    if (progressPercentage > 80) return 'text-orange-600';
    if (progressPercentage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (rateLimitState.isLimited) return 'Bloqueado';
    if (progressPercentage > 80) return 'Crítico';
    if (progressPercentage > 60) return 'Atenção';
    return 'Normal';
  };

  if (!showDetails && !rateLimitState.isLimited && progressPercentage < 60) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {rateLimitState.isLimited && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Muitas tentativas. Tente novamente em alguns minutos.
            {rateLimitState.blockedUntil && (
              <span className="block text-xs mt-1">
                Bloqueado até: {rateLimitState.blockedUntil.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {showDetails && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rate Limit - {endpoint}</span>
            </div>
            <Badge variant="outline" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tentativas: {usedAttempts}/{maxAttempts}</span>
              <span>Restantes: {rateLimitState.remainingAttempts}</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          </div>

          {rateLimitState.resetTime && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Reset em: {rateLimitState.resetTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};