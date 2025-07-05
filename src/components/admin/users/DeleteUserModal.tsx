
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from 'lucide-react';
import { useUserMutations } from '@/hooks/useUserMutations';
import { logger } from '@/utils/logger';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const DeleteUserModal = ({ isOpen, onClose, user }: DeleteUserModalProps) => {
  const [confirmUsername, setConfirmUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const { deleteUser, isDeletingUser } = useUserMutations();

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmUsername !== user.username) {
      alert('Confirmação do nome de usuário incorreta');
      return;
    }

    if (!adminPassword.trim()) {
      alert('Senha de administrador é obrigatória');
      return;
    }

    try {
      logger.info('🗑️ Iniciando exclusão COMPLETA do usuário:', { username: user.username }, 'DELETE_USER_MODAL');
      
      await deleteUser({
        userId: user.id,
        adminPassword: adminPassword.trim()
      });
      
      // Reset form e fechar modal
      setConfirmUsername('');
      setAdminPassword('');
      onClose();
      
    } catch (error) {
      logger.error('❌ Erro na exclusão completa:', { error }, 'DELETE_USER_MODAL');
      // Não resetar o form se der erro, para o usuário tentar novamente
    }
  };

  const handleClose = () => {
    if (!isDeletingUser) {
      setConfirmUsername('');
      setAdminPassword('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Excluir Usuário Completamente
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ATENÇÃO:</strong> Esta ação é irreversível! O usuário "{user.username}" será excluído permanentemente de:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Sistema de autenticação</strong> (não poderá mais fazer login)</li>
                <li><strong>Banco de dados</strong> (perfil, histórico, pontuações, etc.)</li>
                <li><strong>Todas as tabelas relacionadas</strong> (sessões, convites, rankings, etc.)</li>
              </ul>
              <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                <strong>Resultado:</strong> O usuário será completamente removido do sistema e não aparecerá mais no painel de administração nem poderá acessar a conta.
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmUsername">
              Confirme digitando o nome do usuário: <strong>{user.username}</strong>
            </Label>
            <Input
              id="confirmUsername"
              placeholder={`Digite "${user.username}" para confirmar`}
              value={confirmUsername}
              onChange={(e) => setConfirmUsername(e.target.value)}
              required
              disabled={isDeletingUser}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">
              Senha de administrador (para confirmar a ação)
            </Label>
            <Input
              id="adminPassword"
              type="password"
              placeholder="Digite sua senha de administrador"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
              disabled={isDeletingUser}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isDeletingUser}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isDeletingUser || confirmUsername !== user.username || !adminPassword.trim()}
            >
              {isDeletingUser ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Excluindo...
                </div>
              ) : (
                'Excluir Completamente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
