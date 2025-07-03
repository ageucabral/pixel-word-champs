import React, { useState } from 'react';
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

const MyDataSection = () => {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    pixKey: user?.pix_key || '',
    pixHolderName: user?.pix_holder_name || '',
    pixType: 'cpf' as 'cpf' | 'email' | 'phone' | 'random'
  });
  const [showPixKey, setShowPixKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hooks de verificação
  const usernameCheck = useUsernameVerification(editData.username);
  const phoneCheck = usePhoneVerification(editData.phone, user?.phone);

  const isValidUsername = (username: string) => {
    return username.trim().length >= 3 && username.trim().length <= 30;
  };

  // Verificar se há conflitos de duplicidade
  const hasUsernameConflict = () => {
    if (!isEditing || editData.username === user?.username) return false;
    return editData.username.length >= 3 && usernameCheck.exists;
  };

  const hasPhoneConflict = () => {
    if (!isEditing) return false;
    const cleanPhone = editData.phone.replace(/\D/g, '');
    const cleanCurrentPhone = (user?.phone || '').replace(/\D/g, '');
    if (cleanPhone === cleanCurrentPhone) return false;
    return cleanPhone.length >= 10 && phoneCheck.exists;
  };

  const canSave = () => {
    if (!isValidUsername(editData.username)) return false;
    if (hasUsernameConflict() || hasPhoneConflict()) return false;
    if (usernameCheck.checking || phoneCheck.checking) return false;
    return true;
  };

  const handleStartEdit = () => {
    setEditData({
      username: user?.username || '',
      phone: user?.phone || '',
      pixKey: user?.pix_key || '',
      pixHolderName: user?.pix_holder_name || '',
      pixType: 'cpf'
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      username: user?.username || '',
      phone: user?.phone || '',
      pixKey: user?.pix_key || '',
      pixHolderName: user?.pix_holder_name || '',
      pixType: 'cpf'
    });
  };

  const handleSave = async () => {
    if (!canSave()) {
      toast({
        title: "Não é possível salvar",
        description: "Verifique os dados informados e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateProfile({
        username: editData.username,
        phone: editData.phone,
      });

      if (result.success) {
        toast({
          title: "Dados atualizados",
          description: "Suas informações foram salvas com sucesso.",
        });
        setIsEditing(false);
      } else {
        toast({
          title: "Erro ao salvar",
          description: result.error || "Erro inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Erro inesperado ao atualizar dados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarFallback = () => {
    if (user?.username && user.username.length > 0) {
      return user.username.charAt(0).toUpperCase();
    }
    if (user?.email && user.email.length > 0) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="space-y-6">
      {/* XP Progress Section */}
      <XPProgressSection
        permanentXP={user?.experience_points || 0}
        temporaryScore={user?.total_score || 0}
        gamesPlayed={user?.games_played || 0}
      />

      {/* Personal Data Section */}
      <Card className="shadow-sm border-0">
        <DataSectionHeader
          isEditing={isEditing}
          isLoading={isLoading}
          isValidUsername={isValidUsername}
          editUsername={editData.username}
          canSave={canSave()}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
        />
        
        <CardContent className="space-y-6">
          <AvatarSection
            currentAvatar={user?.avatar_url}
            fallback={getAvatarFallback()}
          />

          <UsernameSection
            username={user?.username || ''}
            editUsername={editData.username}
            isEditing={isEditing}
            isValidUsername={isValidUsername}
            onUsernameChange={(username) => setEditData(prev => ({ ...prev, username }))}
          />

          <EmailExchangeSection email={user?.email || ''} />

          <PhoneSection
            phone={user?.phone || ''}
            editPhone={editData.phone}
            isEditing={isEditing}
            onPhoneChange={(phone) => setEditData(prev => ({ ...prev, phone }))}
          />

          <PixConfigSection
            isEditing={isEditing}
            pixHolderName={user?.pix_holder_name || ''}
            pixKey={user?.pix_key || ''}
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

          {isEditing && (hasUsernameConflict() || hasPhoneConflict()) && (
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
