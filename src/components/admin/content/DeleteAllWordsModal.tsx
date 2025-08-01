import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteAllWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  totalWords: number;
}

export const DeleteAllWordsModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting,
  totalWords 
}: DeleteAllWordsModalProps) => {
  const [confirmation, setConfirmation] = useState('');

  const confirmationText = 'EXCLUIR TODAS';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmation !== confirmationText) {
      alert(`Digite exatamente "${confirmationText}" para confirmar`);
      return;
    }

    onConfirm();
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmation('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Excluir Todas as Palavras
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ATENÇÃO:</strong> Esta ação é irreversível! Todas as {totalWords} palavras ativas serão excluídas permanentemente do sistema.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirmText">
              Confirme digitando: <strong>{confirmationText}</strong>
            </Label>
            <Input
              id="confirmText"
              placeholder={`Digite "${confirmationText}" para confirmar`}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
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
              disabled={isDeleting || confirmation !== confirmationText}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Excluindo...
                </div>
              ) : (
                'Excluir Todas as Palavras'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};