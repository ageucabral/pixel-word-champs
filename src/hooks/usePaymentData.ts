
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { IndividualPrize, GroupPrize } from '@/types/payment';
import { secureLogger } from '@/utils/secureLogger';
import { createBrasiliaTimestamp } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

export const usePaymentData = () => {
  const { toast } = useToast();
  const [individualPrizes, setIndividualPrizes] = useState<IndividualPrize[]>([]);
  const [groupPrizes, setGroupPrizes] = useState<GroupPrize[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editIndividualValue, setEditIndividualValue] = useState<string>('');
  const [editGroupPrize, setEditGroupPrize] = useState<GroupPrize | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrizeConfigurations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      secureLogger.debug('Buscando configurações de prêmios', undefined, 'PAYMENT_DATA');
      
      const { data: prizeConfigs, error: fetchError } = await supabase
        .from('prize_configurations')
        .select('*')
        .order('position', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Separar prêmios individuais e em grupo
      const individual: IndividualPrize[] = [];
      const groups: GroupPrize[] = [];

      (prizeConfigs || []).forEach(config => {
        if (config.type === 'individual' && config.position) {
          individual.push({
            position: config.position,
            prize: Number(config.prize_amount) || 0,
            id: config.id
          });
        } else if (config.type === 'group' && config.position_range) {
          groups.push({
            id: config.id,
            name: config.group_name || `${config.position_range}º Lugar`,
            range: config.position_range,
            totalWinners: config.total_winners || 0,
            prizePerWinner: Number(config.prize_amount) || 0,
            active: config.active
          });
        }
      });

      secureLogger.debug('Prêmios carregados com sucesso', { 
        individual: individual.length, 
        groups: groups.length 
      }, 'PAYMENT_DATA');

      setIndividualPrizes(individual);
      setGroupPrizes(groups);
    } catch (error) {
      const errorMessage = 'Erro ao carregar configurações de prêmios';
      secureLogger.error(errorMessage, { error }, 'PAYMENT_DATA');
      setError(errorMessage);
      toast({
        title: "Erro ao carregar prêmios",
        description: "Não foi possível carregar as configurações de premiação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizeConfigurations();
  }, []);

  const calculateTotalPrize = () => {
    try {
      const individualTotal = individualPrizes.reduce((sum, prize) => sum + prize.prize, 0);
      const groupTotal = groupPrizes
        .filter(group => group.active)
        .reduce((sum, group) => sum + (group.totalWinners * group.prizePerWinner), 0);
      
      return individualTotal + groupTotal;
    } catch (error) {
      secureLogger.error('Erro ao calcular prêmio total', { error }, 'PAYMENT_DATA');
      return 0;
    }
  };

  const calculateTotalWinners = () => {
    try {
      const individualWinners = individualPrizes.filter(prize => prize.prize > 0).length;
      const groupWinners = groupPrizes
        .filter(group => group.active)
        .reduce((sum, group) => sum + group.totalWinners, 0);
      
      return individualWinners + groupWinners;
    } catch (error) {
      secureLogger.error('Erro ao calcular total de vencedores', { error }, 'PAYMENT_DATA');
      return 0;
    }
  };

  return {
    individualPrizes,
    groupPrizes,
    editingRow,
    editingGroup,
    editIndividualValue,
    editGroupPrize,
    isLoading,
    error,
    setEditIndividualValue,
    setEditGroupPrize,
    handleEditIndividual: (position: number) => {
      const prize = individualPrizes.find(p => p.position === position);
      if (prize) {
        setEditingRow(position);
        setEditIndividualValue(prize.prize.toString());
      }
    },
    handleSaveIndividual: async (position: number) => {
      try {
        const prizeToUpdate = individualPrizes.find(p => p.position === position);
        if (!prizeToUpdate) return;

        const prizeValue = parseFloat(editIndividualValue.replace(',', '.')) || 0;

        const { error } = await supabase
          .from('prize_configurations')
          .update({ 
            prize_amount: prizeValue,
            updated_at: createBrasiliaTimestamp(new Date().toString())
          })
          .eq('id', prizeToUpdate.id);

        if (error) throw error;

        setIndividualPrizes(prev => 
          prev.map(prize => 
            prize.position === position 
              ? { ...prize, prize: prizeValue }
              : prize
          )
        );

        setEditingRow(null);
        setEditIndividualValue('');
        
        toast({
          title: "Prêmio atualizado",
          description: `Prêmio do ${position}º lugar atualizado com sucesso.`,
        });
      } catch (error) {
        logger.error('❌ Erro ao atualizar prêmio individual:', { error }, 'USE_PAYMENT_DATA');
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o prêmio.",
          variant: "destructive",
        });
      }
    },
    handleEditGroup: (group: GroupPrize) => {
      setEditingGroup(group.id);
      setEditGroupPrize({ ...group });
    },
    handleSaveGroup: async () => {
      if (!editGroupPrize) return;

      try {
        const { error } = await supabase
          .from('prize_configurations')
          .update({
            group_name: editGroupPrize.name,
            total_winners: editGroupPrize.totalWinners,
            prize_amount: editGroupPrize.prizePerWinner,
            updated_at: createBrasiliaTimestamp(new Date().toString())
          })
          .eq('id', editGroupPrize.id);

        if (error) throw error;

        setGroupPrizes(prev =>
          prev.map(group =>
            group.id === editGroupPrize.id ? editGroupPrize : group
          )
        );

        setEditingGroup(null);
        setEditGroupPrize(null);
        
        toast({
          title: "Grupo atualizado",
          description: "Configurações do grupo atualizadas com sucesso.",
        });
      } catch (error) {
        logger.error('❌ Erro ao atualizar grupo:', { error }, 'USE_PAYMENT_DATA');
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o grupo.",
          variant: "destructive",
        });
      }
    },
    handleToggleGroup: async (groupId: string) => {
      try {
        const group = groupPrizes.find(g => g.id === groupId);
        if (!group) return;

        const { error } = await supabase
          .from('prize_configurations')
          .update({ 
            active: !group.active,
            updated_at: createBrasiliaTimestamp(new Date().toString())
          })
          .eq('id', groupId);

        if (error) throw error;

        setGroupPrizes(prev =>
          prev.map(g =>
            g.id === groupId ? { ...g, active: !g.active } : g
          )
        );

        toast({
          title: group.active ? "Grupo desativado" : "Grupo ativado",
          description: `Grupo ${group.name} ${group.active ? 'desativado' : 'ativado'} com sucesso.`,
        });
      } catch (error) {
        logger.error('❌ Erro ao alternar estado do grupo:', { error }, 'USE_PAYMENT_DATA');
        toast({
          title: "Erro",
          description: "Não foi possível alterar o estado do grupo.",
          variant: "destructive",
        });
      }
    },
    handleCancel: () => {
      setEditingRow(null);
      setEditingGroup(null);
      setEditGroupPrize(null);
      setEditIndividualValue('');
    },
    calculateTotalPrize,
    calculateTotalWinners,
    refetch: fetchPrizeConfigurations
  };
};
