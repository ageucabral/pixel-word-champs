import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { UserListHeader } from './UserListHeader';
import { UserCard } from './UserCard';
import { UserListEmpty } from './UserListEmpty';
import { UserModalsManager } from './UserModalsManager';
import { useAllUsers, AllUsersData } from '@/hooks/useAllUsers';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';

export const UserListContainer = () => {
  const { usersList: users = [], isLoading } = useAllUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AllUsersData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewUser = (user: AllUsersData) => {
    console.log('👁️ Visualizando usuário:', {
      userId: user.id,
      username: user.username,
      timestamp: getCurrentBrasiliaTime()
    });
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEditUser = (user: AllUsersData) => {
    console.log('✏️ Editando usuário:', {
      userId: user.id,
      username: user.username,
      timestamp: getCurrentBrasiliaTime()
    });
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleBanUser = (user: AllUsersData) => {
    console.log('🚫 Banindo usuário:', {
      userId: user.id,
      username: user.username,
      timestamp: getCurrentBrasiliaTime()
    });
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const handleDeleteUser = (user: AllUsersData) => {
    console.log('🗑️ Deletando usuário:', {
      userId: user.id,
      username: user.username,
      timestamp: getCurrentBrasiliaTime()
    });
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCloseModals = () => {
    setShowDetailModal(false);
    setShowBanModal(false);
    setShowDeleteModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleBanUserAction = (userId: string, reason: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      handleBanUser(user);
    }
  };

  const handleUnbanUserAction = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      // Handle unban logic here
      console.log('Unban user:', userId);
    }
  };

  const getUserStatusBadge = (user: AllUsersData) => {
    if (user.is_banned) {
      return <span className="text-red-600 text-xs">Banido</span>;
    }
    return <span className="text-green-600 text-xs">Ativo</span>;
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <UserListHeader 
          userCount={0} 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          users={[]}
        />
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Carregando usuários...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm border-slate-200">
        <UserListHeader 
          userCount={filteredUsers.length} 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          users={filteredUsers}
        />
        
        {filteredUsers.length === 0 ? (
          <UserListEmpty searchTerm={searchTerm} />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onBanUser={handleBanUserAction}
                onUnbanUser={handleUnbanUserAction}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                isBanningUser={false}
                isUnbanningUser={false}
                getUserStatusBadge={getUserStatusBadge}
              />
            ))}
          </div>
        )}
      </Card>

      <UserModalsManager
        selectedUser={selectedUser}
        showDetailModal={showDetailModal}
        showBanModal={showBanModal}
        showDeleteModal={showDeleteModal}
        showEditModal={showEditModal}
        showResetModal={false}
        isResettingScores={false}
        onCloseModals={handleCloseModals}
        onCloseResetModal={() => {}}
        onResetScores={async () => {}}
      />
    </>
  );
};
