
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface PrizeSectionProps {
  totalPrizePool: number;
}

export const PrizeSection = ({ totalPrizePool: propsPrizePool }: PrizeSectionProps) => {
  const [calculatedPrizePool, setCalculatedPrizePool] = useState(0);

  useEffect(() => {
    const calculatePrizePool = async () => {
      try {
        const { data: prizeConfigs, error } = await supabase
          .from('prize_configurations')
          .select('*');

        if (error) throw error;

        let total = 0;
        
        // Calcular prêmios individuais
        const individualPrizes = prizeConfigs?.filter(config => config.type === 'individual') || [];
        total += individualPrizes.reduce((sum, prize) => sum + (Number(prize.prize_amount) || 0), 0);

        // Calcular prêmios em grupo (apenas os ativos)
        const groupPrizes = prizeConfigs?.filter(config => config.type === 'group' && config.active) || [];
        total += groupPrizes.reduce((sum, group) => {
          const prizePerWinner = Number(group.prize_amount) || 0;
          const totalWinners = group.total_winners || 0;
          return sum + (prizePerWinner * totalWinners);
        }, 0);

        setCalculatedPrizePool(total);
      } catch (error) {
        logger.error('Erro ao calcular pool de prêmios:', { error }, 'PRIZE_SECTION');
        setCalculatedPrizePool(propsPrizePool);
      }
    };

    calculatePrizePool();
  }, [propsPrizePool]);

  const displayPrizePool = calculatedPrizePool > 0 ? calculatedPrizePool : propsPrizePool;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
        <h3 className="text-sm font-medium text-slate-700">Premiação</h3>
      </div>

      <div className="space-y-1">
        <Label htmlFor="prizePool" className="flex items-center gap-2 text-sm">
          <DollarSign className="h-3 w-3" />
          Valor Total dos Prêmios (R$)
        </Label>
        <div className="bg-slate-50 p-3 rounded border">
          <div className="text-lg font-bold text-green-600">
            R$ {displayPrizePool.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Valor calculado automaticamente baseado nas configurações de prêmios ativas do sistema.
          </p>
        </div>
      </div>
    </div>
  );
};
