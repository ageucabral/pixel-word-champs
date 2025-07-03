
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, UserX, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useResetScores } from '@/hooks/useResetScores';
import { useUsersQuery } from '@/hooks/useUsersQuery';
import { useBanUserMutation } from '@/hooks/useBanUserMutation';
import { useUnbanUserMutation } from '@/hooks/useUnbanUserMutation';
import { ResetScoresModal } from './ResetScoresModal';
import { UserStatsCards } from './UserStatsCards';
import { UserListActions } from './UserListActions';
import { UserGrid } from './UserGrid';

export const UserManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  
  const { 
    data: users = [], 
    isLoading, 
    error, 
    refetch: refetchUsers
  } = useUsersQuery();

  const { banUser, isBanningUser } = useBanUserMutation();
  const { unbanUser, isUnbanningUser } = useUnbanUserMutation();
  const { resetAllScores, isResettingScores } = useResetScores();

  // Filtrar usuários baseado no termo de busca
  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = filteredUsers.filter(user => !user.is_banned);
  const bannedUsers = filteredUsers.filter(user => user.is_banned);

  const handleBanUser = async (userId: string, reason: string) => {
    banUser({ userId, reason });
  };

  const handleUnbanUser = async (userId: string) => {
    unbanUser({ userId });
  };

  const handleResetScores = async (password: string) => {
    try {
      await resetAllScores(password);
      setShowResetModal(false);
      toast({
        title: "Pontuações resetadas",
        description: "Todas as pontuações foram zeradas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao resetar pontuações",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetchUsers();
  };

  const getUserStatusBadge = (user: any) => {
    if (user.is_banned) {
      return <Badge variant="destructive">Banido</Badge>;
    }
    
    const roles = user.roles || ['user'];
    if (roles.includes('admin')) {
      return <Badge variant="default" className="bg-purple-600">Admin</Badge>;
    }
    
    return <Badge variant="secondary">Ativo</Badge>;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro ao carregar usuários: {error.message}</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca e ações */}
      <UserListActions
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={handleRefresh}
        onResetScores={() => setShowResetModal(true)}
        isLoading={isLoading}
        isResettingScores={isResettingScores}
      />

      {/* Estatísticas */}
      <UserStatsCards
        totalUsers={users.length}
        activeUsers={activeUsers.length}
        bannedUsers={bannedUsers.length}
      />

      {/* Tabs de usuários */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Ativos ({activeUsers.length})
          </TabsTrigger>
          <TabsTrigger value="banned" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Banidos ({bannedUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Lista de usuários ativos */}
        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UserGrid
              users={activeUsers}
              isLoading={isLoading}
              onBanUser={handleBanUser}
              onUnbanUser={handleUnbanUser}
              isBanningUser={isBanningUser}
              isUnbanningUser={isUnbanningUser}
              getUserStatusBadge={getUserStatusBadge}
            />
          </div>
        </TabsContent>

        {/* Lista de usuários banidos */}
        <TabsContent value="banned">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UserGrid
              users={bannedUsers}
              isLoading={isLoading}
              onBanUser={handleBanUser}
              onUnbanUser={handleUnbanUser}
              isBanningUser={isBanningUser}
              isUnbanningUser={isUnbanningUser}
              getUserStatusBadge={getUserStatusBadge}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Reset */}
      <ResetScoresModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetScores}
        isResetting={isResettingScores}
      />
    </div>
  );
};
