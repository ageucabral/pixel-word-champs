import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  isDeleting: boolean;
}

export const DeleteCategoryModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  categoryName, 
  isDeleting 
}: DeleteCategoryModalProps) => {
  const [confirmCategoryName, setConfirmCategoryName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmCategoryName !== categoryName) {
      alert('Confirmação do nome da categoria incorreta');
      return;
    }

    onConfirm();
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmCategoryName('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Excluir Categoria
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ATENÇÃO:</strong> Esta ação é irreversível! A categoria "{categoryName}" será excluída permanentemente do sistema.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmCategoryName">
              Confirme digitando o nome da categoria: <strong>{categoryName}</strong>
            </Label>
            <Input
              id="confirmCategoryName"
              placeholder={`Digite "${categoryName}" para confirmar`}
              value={confirmCategoryName}
              onChange={(e) => setConfirmCategoryName(e.target.value)}
              required
              disabled={isDeleting}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isDeleting || confirmCategoryName !== categoryName}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Excluindo...
                </div>
              ) : (
                'Excluir Permanentemente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};