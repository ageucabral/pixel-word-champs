import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Ban, UserCheck, Shield } from 'lucide-react';
import { useAllUsers } from '@/hooks/useAllUsers';

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const BanUserModal = ({ isOpen, onClose, user }: BanUserModalProps) => {
  const [banReason, setBanReason] = useState('');
  const { banUser, unbanUser, isBanningUser, isUnbanningUser } = useAllUsers();

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user.is_banned) {
      // Desbanir usuário
      unbanUser(user.id);
      onClose();
    } else {
      // Banir usuário
      if (!banReason.trim()) {
        alert('Digite o motivo do banimento');
        return;
      }
      
      banUser({
        userId: user.id,
        reason: banReason.trim()
      });
      onClose();
    }
  };

  const handleClose = () => {
    setBanReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {user.is_banned ? (
              <>
                <UserCheck className="h-5 w-5 text-green-600" />
                Desbanir Usuário
              </>
            ) : (
              <>
                <Ban className="h-5 w-5 text-orange-600" />
                Banir Usuário
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {user.is_banned 
                ? `Você está prestes a desbanir o usuário "${user.username}". Esta ação irá restaurar o acesso do usuário ao sistema.`
                : `Você está prestes a banir o usuário "${user.username}". Esta ação irá impedir o acesso do usuário ao sistema.`
              }
            </AlertDescription>
          </Alert>

          {user.is_banned && user.ban_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-1">Motivo do banimento atual:</h4>
              <p className="text-sm text-red-700">{user.ban_reason}</p>
            </div>
          )}

          {!user.is_banned && (
            <div className="space-y-2">
              <Label htmlFor="banReason">Motivo do banimento *</Label>
              <Textarea
                id="banReason"
                placeholder="Descreva o motivo do banimento..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={user.is_banned ? "default" : "destructive"}
              disabled={isBanningUser || isUnbanningUser}
            >
              {isBanningUser || isUnbanningUser ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {user.is_banned ? 'Desbanindo...' : 'Banindo...'}
                </div>
              ) : (
                user.is_banned ? 'Desbanir Usuário' : 'Banir Usuário'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};