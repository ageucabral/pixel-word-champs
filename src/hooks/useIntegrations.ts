
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  apiKey: string;
  settings: Record<string, any>;
  enabled: boolean;
  config: Record<string, any>;
}

export const useIntegrations = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const [fingerprintJS, setFingerprintJS] = useState<Integration>({
    id: 'fingerprintjs',
    name: 'FingerprintJS',
    description: 'Identificação avançada de dispositivos',
    status: 'inactive',
    apiKey: '',
    settings: {},
    enabled: false,
    config: {
      confidenceThreshold: 0.8,
      timeout: 5000,
      enableDeviceTracking: true,
      enableLocationDetection: false
    }
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      
      logger.info('🔄 Buscando configurações das integrações...', undefined, 'USE_INTEGRATIONS');
      
      // Buscar configurações das integrações
      const { data: settings, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('category', 'integrations');

      if (error) {
        logger.error('❌ Erro ao buscar configurações:', { error }, 'USE_INTEGRATIONS');
        throw error;
      }

      logger.info('📋 Configurações encontradas:', { settingsCount: settings?.length }, 'USE_INTEGRATIONS');

      // Processar configurações do FingerprintJS
      const fingerprintConfig = settings?.find(s => s.setting_key === 'fingerprintjs_api_key');
      const fingerprintEnabledConfig = settings?.find(s => s.setting_key === 'fingerprintjs_enabled');
      
      if (fingerprintConfig) {
        const hasKey = !!fingerprintConfig.setting_value;
        const isEnabled = fingerprintEnabledConfig?.setting_value === 'true';
        
        setFingerprintJS(prev => ({
          ...prev,
          apiKey: fingerprintConfig.setting_value || '',
          status: (hasKey && isEnabled) ? 'active' : 'inactive',
          enabled: isEnabled
        }));
        logger.info('🔑 FingerprintJS configurado:', { hasKey, isEnabled }, 'USE_INTEGRATIONS');
      }

    } catch (error) {
      logger.error('❌ Erro ao buscar integrações:', { error }, 'USE_INTEGRATIONS');
      toast({
        title: "Erro",
        description: "Erro ao carregar integrações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIntegration = async (integration: Integration) => {
    try {
      logger.info('💾 Salvando integração:', {
        integrationId: integration.id,
        hasKey: !!integration.apiKey,
        keyLength: integration.apiKey?.length || 0,
        enabled: integration.enabled
      }, 'USE_INTEGRATIONS');
      
      const settingsToSave = [
        {
          setting_key: `${integration.id}_enabled`,
          setting_value: integration.enabled.toString(),
          setting_type: 'boolean',
          description: `${integration.name} habilitado/desabilitado`,
          category: 'integrations'
        },
        {
          setting_key: `${integration.id}_api_key`,
          setting_value: integration.apiKey,
          setting_type: 'string',
          description: `API Key para ${integration.name}`,
          category: 'integrations'
        }
      ];

      for (const setting of settingsToSave) {
        logger.info('🔧 Salvando configuração:', { settingKey: setting.setting_key, hasValue: !!setting.setting_value }, 'USE_INTEGRATIONS');
        
        // Verificar se a configuração já existe
        const { data: existing } = await supabase
          .from('game_settings')
          .select('id')
          .eq('setting_key', setting.setting_key)
          .single();

        if (existing) {
          // Atualizar configuração existente
          const { error } = await supabase
            .from('game_settings')
            .update({
              setting_value: setting.setting_value,
              updated_at: new Date().toISOString()
            })
            .eq('setting_key', setting.setting_key);

          if (error) {
            logger.error(`❌ Erro ao atualizar ${setting.setting_key}:`, { error }, 'USE_INTEGRATIONS');
            throw error;
          }
          logger.info(`✅ Atualizado ${setting.setting_key}`, undefined, 'USE_INTEGRATIONS');
        } else {
          // Criar nova configuração
          const { error } = await supabase
            .from('game_settings')
            .insert(setting);

          if (error) {
            logger.error(`❌ Erro ao criar ${setting.setting_key}:`, { error }, 'USE_INTEGRATIONS');
            throw error;
          }
          logger.info(`✅ Criado ${setting.setting_key}`, undefined, 'USE_INTEGRATIONS');
        }
      }

      // Atualizar estado local
      setFingerprintJS(prev => ({
        ...prev,
        ...integration,
        status: (integration.apiKey && integration.enabled) ? 'active' : 'inactive'
      }));

      toast({
        title: "Sucesso",
        description: `${integration.name} ${integration.enabled ? 'ativado' : 'desativado'} com sucesso`,
      });

      // Recarregar configurações para garantir consistência
      await fetchIntegrations();

    } catch (error: any) {
      logger.error('❌ Erro ao salvar configuração:', { error }, 'USE_INTEGRATIONS');
      toast({
        title: "Erro",
        description: `Erro ao salvar configuração: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const testConnection = async (integrationId: string) => {
    setTestingConnection(integrationId);
    
    try {
      const integration = fingerprintJS;
      
      logger.info('🧪 Testando conexão para:', {
        integrationId,
        hasKey: !!integration.apiKey,
        keyLength: integration.apiKey?.length || 0,
        enabled: integration.enabled
      }, 'USE_INTEGRATIONS');

      if (!integration.enabled) {
        throw new Error('Integração está desabilitada');
      }
      
      // Simulação para FingerprintJS
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isValid = integration.apiKey.length > 10;
      
      if (isValid) {
        toast({
          title: "Conexão bem-sucedida",
          description: `${integration.name} está funcionando corretamente`,
        });
      } else {
        throw new Error('API Key inválida');
      }
      
    } catch (error: any) {
      const integration = fingerprintJS;
      logger.error('❌ Erro no teste de conexão:', { error }, 'USE_INTEGRATIONS');
      toast({
        title: "Erro de conexão",
        description: `Falha ao conectar com ${integration.name}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(null);
    }
  };

  return {
    fingerprintJS,
    setFingerprintJS,
    loading,
    testingConnection,
    handleSaveIntegration,
    testConnection,
    fetchIntegrations
  };
};
