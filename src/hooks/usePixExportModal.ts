
import { useState, useEffect } from 'react';
import { paymentService } from '@/services/paymentService';
import { useToast } from "@/hooks/use-toast";
import { PaymentRecord } from '@/services/paymentService';
import { getCurrentBrasiliaDate, createBrasiliaTimestamp } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

export const usePixExportModal = (open: boolean, prizeLevel: string) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allWinners, setAllWinners] = useState<PaymentRecord[]>([]);
  const [displayWinners, setDisplayWinners] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    if (open) {
      loadAllWinners();
    }
  }, [open, prizeLevel]);

  const loadAllWinners = async () => {
    setIsLoading(true);
    try {
      const winners = await paymentService.getWinnersByPrizeLevel(prizeLevel);
      setAllWinners(winners);
      setDisplayWinners(winners);
    } catch (error) {
      logger.error('Erro ao carregar ganhadores:', { error }, 'USE_PIX_EXPORT_MODAL');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os ganhadores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Selecione as datas de início e fim",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Usar horário de Brasília para filtros
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filtered = allWinners.filter(winner => {
        const winnerDate = new Date(winner.created_at);
        return winnerDate >= start && winnerDate <= end;
      });

      setDisplayWinners(filtered);
      setIsFiltered(true);
      
      toast({
        title: "Filtro aplicado",
        description: `${filtered.length} ganhadores encontrados no período`,
      });
    } catch (error) {
      logger.error('Erro ao filtrar:', { error }, 'USE_PIX_EXPORT_MODAL');
      toast({
        title: "Erro",
        description: "Erro ao aplicar filtro",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilter = () => {
    setDisplayWinners(allWinners);
    setIsFiltered(false);
    setStartDate('');
    setEndDate('');
  };

  const handleMarkAsPaid = async (winnerId: string) => {
    try {
      const success = await paymentService.markAsPaid(winnerId);
      if (success) {
        setDisplayWinners(prev => 
          prev.map(winner => 
            winner.id === winnerId 
              ? { ...winner, payment_status: 'paid' }
              : winner
          )
        );
        
        setAllWinners(prev => 
          prev.map(winner => 
            winner.id === winnerId 
              ? { ...winner, payment_status: 'paid' }
              : winner
          )
        );

        toast({
          title: "Sucesso",
          description: "Pagamento marcado como pago",
        });
      }
    } catch (error) {
      logger.error('Erro ao marcar como pago:', { error }, 'USE_PIX_EXPORT_MODAL');
      toast({
        title: "Erro",
        description: "Erro ao marcar pagamento como pago",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsPaid = async () => {
    try {
      const pendingWinners = displayWinners.filter(w => w.payment_status === 'pending');
      
      for (const winner of pendingWinners) {
        await paymentService.markAsPaid(winner.id);
      }

      setDisplayWinners(prev => 
        prev.map(winner => 
          winner.payment_status === 'pending' 
            ? { ...winner, payment_status: 'paid' }
            : winner
        )
      );

      setAllWinners(prev => 
        prev.map(winner => 
          winner.payment_status === 'pending' 
            ? { ...winner, payment_status: 'paid' }
            : winner
        )
      );

      toast({
        title: "Sucesso",
        description: `${pendingWinners.length} pagamentos marcados como pagos`,
      });
    } catch (error) {
      logger.error('Erro ao marcar todos como pagos:', { error }, 'USE_PIX_EXPORT_MODAL');
      toast({
        title: "Erro",
        description: "Erro ao marcar pagamentos como pagos",
        variant: "destructive",
      });
    }
  };

  return {
    startDate,
    endDate,
    isFiltered,
    isLoading,
    displayWinners,
    setStartDate,
    setEndDate,
    handleFilter,
    handleMarkAsPaid,
    handleMarkAllAsPaid,
    handleClearFilter
  };
};
