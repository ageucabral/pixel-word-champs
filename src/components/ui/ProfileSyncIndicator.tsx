import React from 'react';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { useProfileSync } from '@/hooks/useProfileSync';

interface ProfileSyncIndicatorProps {
  className?: string;
  showManualRefresh?: boolean;
}

export const ProfileSyncIndicator: React.FC<ProfileSyncIndicatorProps> = ({ 
  className = '', 
  showManualRefresh = true 
}) => {
  const { 
    isProfileIncomplete, 
    isRefreshing, 
    refreshCount, 
    lastRefreshAt,
    manualRefresh 
  } = useProfileSync();

  if (!isProfileIncomplete && !isRefreshing) {
    return null; // Perfil está completo e sincronizado
  }

  const handleManualRefresh = async () => {
    const success = await manualRefresh();
    if (success) {
      // Opcional: mostrar toast de sucesso
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Sincronizando perfil...
              </span>
            </>
          ) : isProfileIncomplete ? (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                Dados do perfil incompletos
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Perfil sincronizado
              </span>
            </>
          )}
        </div>

        {showManualRefresh && isProfileIncomplete && !isRefreshing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            className="h-8 px-3 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar
          </Button>
        )}
      </div>

      {/* Informações de debug (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-muted-foreground opacity-70">
          Tentativas: {refreshCount} | 
          {lastRefreshAt && ` Último: ${lastRefreshAt.toLocaleTimeString()}`}
        </div>
      )}
    </div>
  );
};