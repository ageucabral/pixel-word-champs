import React, { memo, useCallback } from 'react';
import { Home, Trophy, UserPlus, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Memoizar cada item de navegação individualmente
const NavigationItem = memo(({ 
  tab, 
  isActive, 
  onTabChange 
}: { 
  tab: { id: string; icon: any; label: string }, 
  isActive: boolean, 
  onTabChange: (tabId: string) => void 
}) => {
  const Icon = tab.icon;
  
  const handleClick = useCallback(() => {
    onTabChange(tab.id);
  }, [tab.id, onTabChange]);

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'text-purple-600 bg-purple-50' 
          : 'text-gray-500 hover:text-gray-700'
      }`}
      aria-label={tab.label}
      aria-pressed={isActive}
    >
      <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''}`} />
      <span className="text-xs font-medium">{tab.label}</span>
    </button>
  );
});

NavigationItem.displayName = 'NavigationItem';

// Configuração de tabs como constante para evitar recriações
const NAVIGATION_TABS = [
  { id: 'home', icon: Home, label: 'Início' },
  { id: 'ranking', icon: Trophy, label: 'Ranking' },
  { id: 'invite', icon: UserPlus, label: 'Convidar' },
  { id: 'profile', icon: User, label: 'Perfil' },
] as const;

const OptimizedBottomNavigation = memo(({ activeTab, onTabChange }: BottomNavigationProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {NAVIGATION_TABS.map((tab) => (
          <NavigationItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onTabChange={onTabChange}
          />
        ))}
      </div>
    </div>
  );
});

OptimizedBottomNavigation.displayName = 'OptimizedBottomNavigation';

export default OptimizedBottomNavigation;