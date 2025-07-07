import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { usePlayerLevel } from '@/hooks/usePlayerLevel';
import { useOptimizedProfile } from '@/hooks/useOptimizedProfile';
import { logger } from '@/utils/logger';
import { formatBrasiliaDate } from '@/utils/brasiliaTimeUnified';
import MyDataSection from './profile/MyDataSection';
import ProfileHeader from './profile/ProfileHeader';
import ProfileStatsGrid from './profile/ProfileStatsGrid';
import ProfileMenu from './profile/ProfileMenu';

interface ProfileScreenProps {
  onNavigateToSettings?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToAchievements?: () => void;
}
const ProfileScreen = ({
  onNavigateToSettings,
  onNavigateToHelp,
  onNavigateToAchievements
}: ProfileScreenProps) => {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const [currentAvatar, setCurrentAvatar] = useState(user?.avatar_url);
  const [showMyData, setShowMyData] = useState(false);
  
  const {
    profile: profileData
  } = useOptimizedProfile();

  // Usar o novo sistema de XP baseado nos experience_points do perfil otimizado
  const {
    currentLevel,
    nextLevel,
    progress
  } = usePlayerLevel(profileData?.experience_points || user?.experience_points || 0);

  logger.debug('Renderizando ProfileScreen', {
    userId: user?.id,
    timestamp: formatBrasiliaDate(new Date())
  }, 'PROFILE_SCREEN');
  const handleMyData = () => {
    logger.info('Abrindo seção Meus Dados', {
      timestamp: formatBrasiliaDate(new Date())
    }, 'PROFILE_SCREEN');
    setShowMyData(true);
  };
  const handleHelp = () => {
    logger.info('Navegando para ajuda', {
      timestamp: formatBrasiliaDate(new Date())
    }, 'PROFILE_SCREEN');
    if (onNavigateToHelp) {
      onNavigateToHelp();
    }
  };
  const handleAchievements = () => {
    // Função desabilitada - não faz nada
    return;
  };
  const handleLogout = async () => {
    try {
      logger.info('Iniciando logout', {
        userId: user?.id,
        timestamp: formatBrasiliaDate(new Date())
      }, 'PROFILE_SCREEN');
      await logout();
      logger.info('Logout realizado com sucesso', {
        timestamp: formatBrasiliaDate(new Date())
      }, 'PROFILE_SCREEN');
      navigate('/auth');
    } catch (error) {
      logger.error('Erro ao fazer logout', {
        error,
        timestamp: formatBrasiliaDate(new Date())
      }, 'PROFILE_SCREEN');
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
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    logger.info('Avatar atualizado', {
      timestamp: formatBrasiliaDate(new Date())
    }, 'PROFILE_SCREEN');
    setCurrentAvatar(newAvatarUrl);
  };
  const formatXP = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  };
  if (showMyData) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 pb-20">
        <div className="max-w-md mx-auto space-y-4 w-full px-2 sm:px-0">
          {/* Header com botão voltar */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setShowMyData(false)}>
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Meus Dados</h1>
              <p className="text-sm text-gray-600">Gerencie suas informações pessoais</p>
            </div>
          </div>

          <MyDataSection />
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4 w-full px-2 sm:px-0">

        {/* Card principal do jogador com novo sistema XP */}
        <ProfileHeader user={user} currentAvatar={currentAvatar} currentLevel={currentLevel} nextLevel={nextLevel} progress={progress} onAvatarUpdate={handleAvatarUpdate} getAvatarFallback={getAvatarFallback} formatXP={formatXP} />
        

        {/* Estatísticas compactas */}
        <ProfileStatsGrid user={profileData || user} />

        {/* Menu de ações */}
        <ProfileMenu onMyData={handleMyData} onAchievements={handleAchievements} onSettings={onNavigateToSettings} onHelp={handleHelp} onLogout={handleLogout} />
      </div>
    </div>;
};
export default ProfileScreen;