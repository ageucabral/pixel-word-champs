
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Gift, Star, Zap, Crown, Copy, Clock, Plus, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface CompactInviteInfoProps {
  stats: {
    totalPoints: number;
    activeFriends: number;
    totalInvites: number;
    monthlyPoints?: number;
    userLevel?: number;
    nextLevel?: number;
    levelProgress?: number;
    totalScore?: number;
    experiencePoints?: number;
    partialFriends?: number;
  } | null;
  inviteCode: string | null;
  onCopyCode: () => void;
}

const CompactInviteInfo = ({ stats, inviteCode, onCopyCode }: CompactInviteInfoProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const safeStats = stats || {
    totalPoints: 0,
    activeFriends: 0,
    totalInvites: 0,
    monthlyPoints: 0,
    userLevel: 1,
    nextLevel: 2,
    levelProgress: 0,
    partialFriends: 0
  };
  
  const currentLevel = safeStats.userLevel || 1;
  const nextLevel = safeStats.nextLevel || 2;
  const levelProgress = safeStats.levelProgress || 0;
  
  const getLevelInfo = (level: number) => {
    if (level >= 20) return { level: 'Lendário', color: 'from-yellow-400 to-orange-500', icon: '👑', bgColor: 'bg-yellow-100' };
    if (level >= 15) return { level: 'Mestre', color: 'from-purple-400 to-purple-600', icon: '🏆', bgColor: 'bg-purple-100' };
    if (level >= 10) return { level: 'Experiente', color: 'from-blue-400 to-blue-600', icon: '⭐', bgColor: 'bg-blue-100' };
    if (level >= 5) return { level: 'Iniciante', color: 'from-green-400 to-green-600', icon: '🌟', bgColor: 'bg-green-100' };
    return { level: 'Novato', color: 'from-gray-400 to-gray-600', icon: '🎯', bgColor: 'bg-gray-100' };
  };

  const levelInfo = getLevelInfo(currentLevel);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      toast({
        title: "Código gerado!",
        description: "Recarregue a página para ver seu novo código.",
      });
      
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o código. Tente recarregar a página.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl">
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Cabeçalho Unificado - Responsivo */}
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <h3 className="font-bold text-sm sm:text-base md:text-lg truncate">Suas Estatísticas & Código Mágico</h3>
        </div>

        {/* Seção Superior: Layout responsivo - coluna em mobile, lado a lado em desktop */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 md:mb-4">
          {/* Nível do Usuário - Compacto para mobile */}
          <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="text-xl sm:text-2xl shrink-0">{levelInfo.icon}</div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm sm:text-base truncate">{levelInfo.level}</span>
                  <span className="text-xs opacity-75">Nível {currentLevel}</span>
                </div>
              </div>
              <Badge className="bg-white/30 text-white border-white/30 text-xs px-2 py-1 shrink-0">
                {safeStats.totalPoints} XP
              </Badge>
            </div>
            
            {/* Barra de Progresso - Compacta */}
            <div className="space-y-1 sm:space-y-2">
              <div className="flex justify-between text-xs opacity-90">
                <span>Nv. {currentLevel}</span>
                <span>Nv. {nextLevel}</span>
              </div>
              <Progress 
                value={levelProgress} 
                className="h-1.5 sm:h-2 bg-white/20"
              />
              <div className="text-center text-xs opacity-80">
                {Math.round(levelProgress)}% para o próximo nível
              </div>
            </div>
          </div>

          {/* Código Mágico - Compacto para mobile */}
          <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Gift className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Seu Código</span>
            </div>
            {inviteCode ? (
              <>
                <div className="text-center mb-2 md:mb-3">
                  <p className="text-base sm:text-lg md:text-xl font-bold tracking-wider break-all">{inviteCode}</p>
                </div>
                <Button 
                  onClick={onCopyCode}
                  size="sm"
                  className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0 text-white text-xs h-7 sm:h-8"
                >
                  <Copy className="w-3 h-3 mr-1 shrink-0" />
                  <span className="truncate">Copiar Código</span>
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-2 md:mb-3">
                  <p className="text-sm opacity-75 mb-2">Código será criado automaticamente</p>
                </div>
                <Button 
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  size="sm"
                  className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 border-0 text-white text-xs h-7 sm:h-8"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-3 h-3 mr-1 shrink-0 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1 shrink-0" />
                  )}
                  <span className="truncate">
                    {isGenerating ? 'Recarregando...' : 'Recarregar Página'}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Grid de Estatísticas - Responsivo com espaçamentos menores */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 md:mb-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center">
            <div className="flex justify-center mb-1">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-200" />
            </div>
            <p className="text-base sm:text-lg font-bold">{safeStats.activeFriends}</p>
            <p className="text-xs opacity-80 leading-tight">Amigos Ativos</p>
            <p className="text-xs opacity-60">(50 XP cada)</p>
          </div>
          
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center">
            <div className="flex justify-center mb-1">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-200" />
            </div>
            <p className="text-base sm:text-lg font-bold">{safeStats.partialFriends || 0}</p>
            <p className="text-xs opacity-80 leading-tight">Parcialmente Ativos</p>
            <p className="text-xs opacity-60">(5 XP cada)</p>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center">
            <div className="flex justify-center mb-1">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
            </div>
            <p className="text-base sm:text-lg font-bold">{safeStats.monthlyPoints || 0}</p>
            <p className="text-xs opacity-80 leading-tight">Pontos no Mês</p>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 text-center">
            <div className="flex justify-center mb-1">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200" />
            </div>
            <p className="text-base sm:text-lg font-bold">{safeStats.totalInvites}</p>
            <p className="text-xs opacity-80 leading-tight">Total Convites</p>
          </div>
        </div>

        {/* Seção Final: Sistema de Recompensas - Texto menor em mobile */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">Sistema de Recompensas</span>
          </div>
          <div className="text-xs opacity-90 space-y-1 leading-relaxed">
            <p>• <strong>5 XP imediatos</strong> quando alguém usa seu código</p>
            <p>• <strong>+45 XP extras</strong> quando jogam por 5 dias diferentes</p>
            <p>• <strong>Total: 50 XP</strong> por amigo totalmente ativo</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactInviteInfo;
