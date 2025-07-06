
import React, { useRef, useState } from 'react';
import { Loader2, Plus, Camera, Image } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { avatarService } from '@/services/avatarService';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface AvatarUploadProps {
  currentAvatar?: string;
  fallback: string;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarUpload = ({ currentAvatar, fallback, onAvatarUpdate, size = 'lg' }: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Por favor, selecione apenas arquivos de imagem.';
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return 'Arquivo muito grande. Tamanho máximo: 5MB.';
    }
    
    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar arquivo
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Arquivo inválido",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setShowSelectionDialog(false);

    try {
      // Upload da imagem
      const uploadResponse = await avatarService.uploadAvatar(file, user.id);
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error);
      }

      // Atualizar perfil com nova URL
      const updateResponse = await profileService.updateProfile({
        avatar_url: uploadResponse.data
      });

      if (!updateResponse.success) {
        throw new Error(updateResponse.error);
      }

      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      onAvatarUpdate?.(uploadResponse.data);
    } catch (error) {
      logger.error('Erro ao fazer upload:', { error }, 'AVATAR_UPLOAD');
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Limpar inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    setShowSelectionDialog(true);
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  return (
    <>
      <div className="relative inline-block">
        <Avatar 
          className={`${sizeClasses[size]} border-4 border-white shadow-lg cursor-pointer hover:opacity-80 transition-opacity ${isUploading ? 'opacity-50' : ''}`} 
          onClick={isUploading ? undefined : handleUploadClick}
        >
          <AvatarImage 
            src={currentAvatar} 
            className="object-cover w-full h-full"
          />
          <AvatarFallback 
            className="text-gray-700 text-lg font-bold bg-white cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : currentAvatar ? (
              fallback
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Plus className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">Foto</span>
              </div>
            )}
          </AvatarFallback>
        </Avatar>

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-full">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Dialog de seleção */}
      <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar foto do perfil</DialogTitle>
            <DialogDescription>
              Escolha como deseja adicionar sua nova foto:
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={handleCameraClick}
              disabled={isUploading}
            >
              <Camera className="w-6 h-6" />
              <span className="text-sm">Câmera</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={handleGalleryClick}
              disabled={isUploading}
            >
              <Image className="w-6 h-6" />
              <span className="text-sm">Galeria</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Input para câmera (Android/iOS nativos) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Input para galeria */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};

export default AvatarUpload;
