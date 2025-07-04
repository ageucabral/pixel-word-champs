
import React, { useState } from 'react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { AdminUsersListContainer } from './AdminUsersListContainer';
import { EditUserModal } from './EditUserModal';
import { logger } from '@/utils/logger';

export const AdminUsersList = () => {
  const [editingUser, setEditingUser] = useState<{ id: string; username: string } | null>(null);
  const { usersList, isLoading, removeAdminRole, refetch } = useAdminUsers();

  logger.debug('Renderizando lista de usuários admin', { 
    usersCount: usersList?.length,
    isLoading 
  }, 'ADMIN_USERS_LIST');

  const handleEditUser = (user: { id: string; username: string }) => {
    logger.info('Editando usuário admin', { userId: user.id }, 'ADMIN_USERS_LIST');
    setEditingUser(user);
  };

  const handleRemoveUser = (userId: string, username: string) => {
    logger.info('Removendo usuário admin', { userId }, 'ADMIN_USERS_LIST');
    removeAdminRole(userId, username);
  };

  const handleCloseModal = () => {
    logger.debug('Fechando modal de edição', undefined, 'ADMIN_USERS_LIST');
    setEditingUser(null);
  };

  const handleUserUpdated = () => {
    logger.info('Usuário admin atualizado', undefined, 'ADMIN_USERS_LIST');
    refetch();
  };

  return (
    <>
      <AdminUsersListContainer
        usersList={usersList}
        isLoading={isLoading}
        onEditUser={handleEditUser}
        onRemoveUser={handleRemoveUser}
      />

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={handleCloseModal}
          userId={editingUser.id}
          username={editingUser.username}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
};
