
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

export const AdminPanelHeader = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      logger.info('Iniciando logout do painel admin', undefined, 'ADMIN_PANEL_HEADER');
      await logout();
      logger.info('Logout realizado, redirecionando...', undefined, 'ADMIN_PANEL_HEADER');
      navigate('/auth');
    } catch (error: any) {
      logger.error('Erro durante logout do admin', { error: error.message }, 'ADMIN_PANEL_HEADER');
    }
  };

  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Painel Administrativo
        </h1>
        <p className="text-slate-600 mt-2">
          Gerencie todos os aspectos da plataforma
        </p>
      </div>
      <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 hover:bg-red-50 border-red-200 text-red-700">
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};
