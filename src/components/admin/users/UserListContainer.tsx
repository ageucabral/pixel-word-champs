
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { UserListHeader } from './UserListHeader';
import { UserCard } from './UserCard';
import { UserListEmpty } from './UserListEmpty';
import { UserModalsManager } from './UserModalsManager';
import { useAllUsers, AllUsersData } from '@/hooks/useAllUsers';
import { getCurrentBrasiliaTime } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

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
    logger.info('👁️ Visualizando usuário:', {
      username: user.username,
      timestamp: getCurrentBrasiliaTime()
    }, 'USER_LIST_CONTAINER');
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEditUser = (user: AllUsersData) => {
    logger.info('✏️ Editando usuário:', {
      username: user.username,
      timestamp: getCurrentBrasiliaTime()
    }, 'USER_LIST_CONTAINER');
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleBanUser = (user: AllUsersData) => {
    logger.info('🚫 Banindo usuário:', {
      username: user.username,
      timestamp: getCurrentBrasiliaTime()
    }, 'USER_LIST_CONTAINER');
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const handleDeleteUser = (user: AllUsersData) => {
    logger.info('🗑️ Deletando usuário:', {
      username: user.username,
      timestamp: getCurrentBrasiliaTime()
    }, 'USER_LIST_CONTAINER');
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
                onViewUser={handleViewUser}
                onEditUser={handleEditUser}
                onBanUser={handleBanUser}
                onDeleteUser={handleDeleteUser}
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
