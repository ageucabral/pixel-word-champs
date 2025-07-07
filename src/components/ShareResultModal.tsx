import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import config from '@/config/environment';

interface ShareResultModalProps {
  competition: {
    id: string;
    weekStart: string;
    weekEnd: string;
    userPosition: number;
    userScore: number;
    totalParticipants: number;
    prize?: number;
    paymentStatus?: 'pending' | 'paid' | 'not_eligible';
  };
  onClose: () => void;
}

const ShareResultModal = ({ competition, onClose }: ShareResultModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Usando configurações do ambiente
  const inviteCode = config.invite.defaultCode;
  const inviteLink = `${config.invite.baseUrl}/join/${inviteCode}`;
  
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  const getShareMessage = () => {
    const weekRange = formatDateRange(competition.weekStart, competition.weekEnd);
    const weekNumber = competition.id.split('-w')[1];
    
    if (competition.prize && competition.prize > 0) {
      // Foco no prêmio quando houver
      return `🏆 Ganhei R$ ${competition.prize.toFixed(2)} no Caça Palavras Royale! 🎉\n\nFiquei em #${competition.userPosition} lugar na competição semanal ${weekNumber} (${weekRange}) com ${competition.userScore.toLocaleString()} pontos!\n\nVenha jogar comigo e também ganhe prêmios em dinheiro! 💰`;
    } else {
      // Foco na posição quando não houver prêmio
      return `🎯 Fiquei em #${competition.userPosition} lugar no Caça Palavras Royale! \n\nCompetição semanal ${weekNumber} (${weekRange}) - ${competition.userScore.toLocaleString()} pontos entre ${competition.totalParticipants.toLocaleString()} jogadores!\n\nVenha jogar comigo e competir por prêmios em dinheiro! 🏆`;
    }
  };

  const shareText = getShareMessage();
  const fullMessage = `${shareText}\n\n${inviteLink}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Mensagem copiada para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnSocial = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(inviteLink);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`;
        break;
      case 'instagram':
        copyToClipboard();
        toast({
          title: "Texto copiado!",
          description: "Cole no Instagram Stories ou posts.",
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Compartilhar Resultado</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Preview da mensagem */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
          <p className="text-sm text-gray-700 whitespace-pre-line">{shareText}</p>
          <p className="text-sm text-purple-600 mt-2 font-medium">{inviteLink}</p>
        </div>

        {/* Botão de copiar */}
        <Button 
          onClick={copyToClipboard}
          variant="outline"
          className="w-full mb-4"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Mensagem
            </>
          )}
        </Button>
        
        {/* Opções de compartilhamento */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Compartilhar em:</p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => shareOnSocial('whatsapp')}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              <span className="font-bold text-sm">W</span>
              <span className="text-sm">WhatsApp</span>
            </button>
            
            <button
              onClick={() => shareOnSocial('telegram')}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <span className="font-bold text-sm">T</span>
              <span className="text-sm">Telegram</span>
            </button>
            
            <button
              onClick={() => shareOnSocial('facebook')}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <span className="font-bold text-sm">F</span>
              <span className="text-sm">Facebook</span>
            </button>
            
            <button
              onClick={() => shareOnSocial('twitter')}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
            >
              <span className="font-bold text-sm">X</span>
              <span className="text-sm">Twitter</span>
            </button>
          </div>
          
          <button
            onClick={() => shareOnSocial('instagram')}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            <span className="font-bold text-sm">IG</span>
            <span className="text-sm">Instagram</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareResultModal;
