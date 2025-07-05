import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from "@/hooks/use-toast";
import { useUsernameVerification } from '@/hooks/useUsernameVerification';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import DataSectionHeader from './sections/DataSectionHeader';
import AvatarSection from './sections/AvatarSection';
import UsernameSection from './sections/UsernameSection';
import EmailExchangeSection from './sections/EmailExchangeSection';
import PhoneSection from './sections/PhoneSection';
import PixConfigSection from './sections/PixConfigSection';
import XPProgressSection from './sections/XPProgressSection';
import { logger } from '@/utils/logger';

const MyDataSection = () => {
  const { user } = useAuth();
  const { profile, updateProfile, refetch } = useProfile();
  const { toast } = useToast();
  
  // Usar dados do profile quando disponível, senão do user
  const currentData = profile || user;
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPixKey, setShowPixKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Memoizar dados iniciais para evitar re-inicializações
  const initialEditData = useMemo(() => ({
    username: currentData?.username || '',
    phone: currentData?.phone || '',
    pixKey: currentData?.pix_key || '',
    pixHolderName: currentData?.pix_holder_name || '',
    pixType: 'cpf' as 'cpf' | 'email' | 'phone' | 'random'
  }), [currentData?.username, currentData?.phone, currentData?.pix_key, currentData?.pix_holder_name]);

  const [editData, setEditData] = useState(initialEditData);

  // Sincronizar editData quando dados atuais mudam e não está editando
  useEffect(() => {
    if (!isEditing) {
      setEditData(initialEditData);
    }
  }, [initialEditData, isEditing]);

  // Hooks de verificação - só executar quando em modo de edição
  const usernameCheck = useUsernameVerification(isEditing ? editData.username : '');
  const phoneCheck = usePhoneVerification(isEditing ? editData.phone : '', currentData?.phone);

  const isValidUsername = (username: string) => {
    return username.trim().length >= 3 && username.trim().length <= 30;
  };

  // Memoizar verificações de conflito
  const hasUsernameConflict = useMemo(() => {
    if (!isEditing || editData.username === currentData?.username) return false;
    return editData.username.length >= 3 && usernameCheck.exists;
  }, [isEditing, editData.username, currentData?.username, usernameCheck.exists]);

  const hasPhoneConflict = useMemo(() => {
    if (!isEditing) return false;
    const cleanPhone = editData.phone.replace(/\D/g, '');
    const cleanCurrentPhone = (currentData?.phone || '').replace(/\D/g, '');
    if (cleanPhone === cleanCurrentPhone) return false;
    return cleanPhone.length >= 10 && phoneCheck.exists;
  }, [isEditing, editData.phone, currentData?.phone, phoneCheck.exists]);

  const canSave = useMemo(() => {
    if (!isValidUsername(editData.username)) return false;
    if (hasUsernameConflict || hasPhoneConflict) return false;
    if (usernameCheck.checking || phoneCheck.checking) return false;
    return true;
  }, [editData.username, hasUsernameConflict, hasPhoneConflict, usernameCheck.checking, phoneCheck.checking]);

  // Handlers memoizados
  const handleStartEdit = useCallback(() => {
    setEditData(initialEditData);
    setIsEditing(true);
  }, [initialEditData]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditData(initialEditData);
  }, [initialEditData]);

  const handleSave = useCallback(async () => {
    if (!canSave) {
      toast({
        title: "Não é possível salvar",
        description: "Verifique os dados informados e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      logger.info('🔄 Salvando dados:', { 
        hasUsername: !!editData.username,
        hasPhone: !!editData.phone,
        hasPixKey: !!editData.pixKey
      }, 'MY_DATA_SECTION');
      
      const result = await updateProfile({
        username: editData.username,
        phone: editData.phone,
        pix_key: editData.pixKey,
        pix_holder_name: editData.pixHolderName,
      });

      logger.info('💾 Resultado do salvamento:', {
        success: result.success
      }, 'MY_DATA_SECTION');

      if (result.success) {
        // Aguardar um pouco e atualizar dados
        await new Promise(resolve => setTimeout(resolve, 500));
        await refetch();
        
        toast({
          title: "Dados atualizados",
          description: "Suas informações foram salvas com sucesso.",
        });
        setIsEditing(false);
      } else {
        logger.error('❌ Erro no salvamento:', { error: result.error }, 'MY_DATA_SECTION');
        toast({
          title: "Erro ao salvar",
          description: result.error || "Erro inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('❌ Erro inesperado:', { error }, 'MY_DATA_SECTION');
      toast({
        title: "Erro ao salvar",
        description: "Erro inesperado ao atualizar dados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [canSave, editData, updateProfile, toast]);

  const getAvatarFallback = useCallback(() => {
    if (currentData?.username && currentData.username.length > 0) {
      return currentData.username.charAt(0).toUpperCase();
    }
    if (currentData?.email && currentData.email.length > 0) {
      return currentData.email.charAt(0).toUpperCase();
    }
    return 'U';
  }, [currentData?.username, currentData?.email]);

  return (
    <div className="space-y-6">
      {/* XP Progress Section */}
      <XPProgressSection
        permanentXP={currentData?.experience_points || 0}
        temporaryScore={currentData?.total_score || 0}
        gamesPlayed={currentData?.games_played || 0}
      />

      {/* Personal Data Section */}
      <Card className="shadow-sm border-0">
        <DataSectionHeader
          isEditing={isEditing}
          isLoading={isLoading}
          isValidUsername={isValidUsername}
          editUsername={editData.username}
          canSave={canSave}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
        />
        
        <CardContent className="space-y-6">
          <AvatarSection
            currentAvatar={currentData?.avatar_url}
            fallback={getAvatarFallback()}
          />

          <UsernameSection
            username={currentData?.username || ''}
            editUsername={editData.username}
            isEditing={isEditing}
            isValidUsername={isValidUsername}
            onUsernameChange={(username) => setEditData(prev => ({ ...prev, username }))}
          />

          <EmailExchangeSection email={currentData?.email || ''} />

          <PhoneSection
            phone={currentData?.phone || ''}
            editPhone={editData.phone}
            isEditing={isEditing}
            onPhoneChange={(phone) => setEditData(prev => ({ ...prev, phone }))}
          />

          <PixConfigSection
            isEditing={isEditing}
            pixHolderName={currentData?.pix_holder_name || ''}
            pixKey={currentData?.pix_key || ''}
            pixType={'cpf'}
            editPixHolderName={editData.pixHolderName}
            editPixKey={editData.pixKey}
            editPixType={editData.pixType}
            showPixKey={showPixKey}
            onPixHolderNameChange={(value) => setEditData(prev => ({ ...prev, pixHolderName: value }))}
            onPixKeyChange={(value) => setEditData(prev => ({ ...prev, pixKey: value }))}
            onPixTypeChange={(value) => setEditData(prev => ({ ...prev, pixType: value }))}
            onToggleShowPixKey={() => setShowPixKey(!showPixKey)}
          />

          {isEditing && (hasUsernameConflict || hasPhoneConflict) && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Atenção:</strong> Alguns dados já estão em uso por outro usuário. 
                Corrija os conflitos antes de salvar.
              </p>
            </div>
          )}

          {isEditing && (
            <div className="bg-blue-50 p-3 rounded-lg border">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> As informações PIX serão usadas para receber premiações. 
                Certifique-se de que os dados estão corretos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyDataSection;
