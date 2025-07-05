
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';

interface DeleteInactiveWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inactiveWordsCount: number;
}

export const DeleteInactiveWordsModal = ({ isOpen, onClose, onSuccess, inactiveWordsCount }: DeleteInactiveWordsModalProps) => {
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (password !== 'DELETE_INACTIVE_WORDS') {
      toast({
        title: "Senha incorreta",
        description: "Digite exatamente 'DELETE_INACTIVE_WORDS' para confirmar",
        variant: "destructive"
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      logger.info('🗑️ Iniciando exclusão de palavras inativas...', undefined, 'DELETE_INACTIVE_WORDS');
      
      const { error, count } = await supabase
        .from('level_words')
        .delete()
        .eq('is_active', false);

      if (error) {
        logger.error('❌ Erro ao deletar palavras inativas:', { error }, 'DELETE_INACTIVE_WORDS');
        throw error;
      }

      logger.info(`✅ ${count} palavras inativas deletadas com sucesso`, { count }, 'DELETE_INACTIVE_WORDS');
      
      toast({
        title: "Sucesso!",
        description: `${count} palavras inativas foram deletadas do banco de dados`,
        variant: "default"
      });

      onSuccess();
      onClose();
      setPassword('');
    } catch (error: any) {
      logger.error('❌ Erro durante exclusão:', { error }, 'DELETE_INACTIVE_WORDS');
      toast({
        title: "Erro ao deletar",
        description: error.message || "Falha ao deletar palavras inativas",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setPassword('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Deletar Palavras Inativas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>AÇÃO IRREVERSÍVEL!</strong><br />
              Esta ação irá deletar permanentemente <strong>{inactiveWordsCount} palavras inativas</strong> do banco de dados.
              Esta operação não pode ser desfeita.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Para confirmar, digite: <code className="bg-gray-100 px-1 rounded text-xs">DELETE_INACTIVE_WORDS</code>
            </Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a confirmação aqui..."
              disabled={isDeleting}
              className="font-mono"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || password !== 'DELETE_INACTIVE_WORDS'}
              className="min-w-[120px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Todas
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
