
import React, { useRef, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

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
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} border-4 border-white shadow-lg cursor-pointer hover:opacity-80 transition-opacity`} onClick={handleUploadClick}>
        <AvatarImage 
          src={currentAvatar} 
          className="object-cover w-full h-full"
        />
        <AvatarFallback 
          className="text-gray-700 text-lg font-bold bg-white cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          {currentAvatar ? fallback : (
            <div className="flex flex-col items-center justify-center">
              <Plus className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">Foto</span>
            </div>
          )}
        </AvatarFallback>
      </Avatar>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUpload;
