import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Crown, Trophy, Medal, Gift } from 'lucide-react';

interface ConfiguredPrize {
  position: number;
  prize_amount: number;
  active: boolean;
  description?: string;
}

interface MonthlyPrizeDisplayProps {
  configuredPrizes: ConfiguredPrize[];
}

const MonthlyPrizeDisplay = ({ configuredPrizes }: MonthlyPrizeDisplayProps) => {
  const getPrizeIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Trophy className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Medal className="w-4 h-4 text-orange-500" />;
      default:
        return <Gift className="w-4 h-4 text-purple-500" />;
    }
  };

  const getPrizeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'text-yellow-600';
      case 2:
        return 'text-gray-600';
      case 3:
        return 'text-orange-600';
      default:
        return 'text-purple-600';
    }
  };

  const getPrizeBackground = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-50';
      case 2:
        return 'bg-gray-50';
      case 3:
        return 'bg-orange-50';
      default:
        return 'bg-purple-50';
    }
  };

  // Filtrar apenas prêmios ativos e ordenar por posição
  const activePrizes = configuredPrizes?.filter(prize => prize.active)?.sort((a, b) => a.position - b.position) || [];

  if (activePrizes.length === 0) {
    return (
      <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-gray-700">
            <Crown className="w-4 h-4 text-purple-500" />
            Premiação do Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="text-center py-2 text-gray-500">
            <p className="text-xs">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-gray-700">
          <Crown className="w-4 h-4 text-purple-500" />
          Premiação do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {activePrizes.slice(0, 3).map(prize => (
            <div key={prize.position} className={`${getPrizeBackground(prize.position)} rounded-lg p-2 text-center`}>
              <div className="flex flex-col items-center gap-1">
                {getPrizeIcon(prize.position)}
                <span className="text-xs font-medium text-gray-700">
                  {prize.position}º
                </span>
                <span className={`text-sm font-bold ${getPrizeColor(prize.position)}`}>
                  R$ {prize.prize_amount.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyPrizeDisplay;