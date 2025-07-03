
import React, { memo, useCallback } from 'react';
import { Home, Trophy, UserPlus, User } from 'lucide-react';
import { logger } from '@/utils/logger';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation = memo(({ activeTab, onTabChange }: BottomNavigationProps) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'ranking', icon: Trophy, label: 'Ranking' },
    { id: 'invite', icon: UserPlus, label: 'Convidar' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  const handleTabChange = useCallback((tabId: string) => {
    logger.info('Navegação entre abas', { 
      from: activeTab, 
      to: tabId 
    }, 'BOTTOM_NAVIGATION');
    onTabChange(tabId);
  }, [activeTab, onTabChange]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 sm:px-4 py-2 shadow-lg safe-area-inset backdrop-blur-sm">
      <div className="flex justify-around items-center w-full max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center min-h-[44px] min-w-[44px] p-2 rounded-lg transition-all duration-200 touch-action-manipulation ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              aria-label={`Navegar para ${tab.label}`}
            >
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium hidden sm:block">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

export default BottomNavigation;
