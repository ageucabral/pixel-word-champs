
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { unifiedCompetitionService } from '@/services/unifiedCompetitionService';
import { CompetitionEditActions } from './CompetitionEditActions';
import { PrizeConfigurationSection } from '../competition-form/PrizeConfigurationSection';
import { usePaymentData } from '@/hooks/usePaymentData';

interface BaseCompetition {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  prize_pool: number;
  max_participants: number;
  total_participants?: number;
  competition_type?: string;
  theme?: string;
  rules?: any;
}

interface EditCompetitionFormProps {
  competition: BaseCompetition | null;
  onClose: () => void;
  onCompetitionUpdated?: () => void;
}

export const EditCompetitionForm: React.FC<EditCompetitionFormProps> = ({
  competition,
  onClose,
  onCompetitionUpdated
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const paymentData = usePaymentData();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (competition) {
      console.log('📝 Carregando dados da competição para edição:', {
        id: competition.id,
        title: competition.title,
        originalStartDate: competition.start_date,
        originalEndDate: competition.end_date,
        originalStatus: competition.status
      });
      
      // Extrair apenas a data (YYYY-MM-DD) dos timestamps
      const startDate = competition.start_date.split('T')[0];
      const endDate = competition.end_date.split('T')[0];
      
      setFormData({
        title: competition.title,
        description: competition.description || '',
        startDate: startDate,
        endDate: endDate
      });
    }
  }, [competition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competition) return;

    setIsLoading(true);
    try {
      console.log('💾 Salvando alterações da competição:', {
        id: competition.id,
        newTitle: formData.title,
        newDescription: formData.description,
        newStartDate: formData.startDate,
        newEndDate: formData.endDate
      });

      const isDailyCompetition = competition.theme || competition.competition_type === 'challenge';

      if (isDailyCompetition) {
        // Para competições diárias, usar o serviço unificado
        const updateData = {
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          endDate: formData.endDate,
          maxParticipants: 0
        };

        const response = await unifiedCompetitionService.updateCompetition(competition.id, updateData);
        
        if (response.success) {
          toast({
            title: "Sucesso",
            description: "Competição diária atualizada avec sucesso"
          });
          if (onCompetitionUpdated) {
            onCompetitionUpdated();
          }
          onClose();
        } else {
          throw new Error(response.error || 'Erro ao atualizar competição');
        }
      } else {
        // Para competições semanais, manter lógica existente
        toast({
          title: "Aviso",
          description: "Edição de competições semanais ainda não implementada neste contexto",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar competição:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar a competição",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!competition) return null;

  const isDailyCompetition = competition.theme || competition.competition_type === 'challenge';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate">Data de Fim</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>
        </div>

        {isDailyCompetition && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <Label className="text-sm font-medium text-green-800">Configurações Automáticas</Label>
            <div className="text-sm text-green-700 mt-1 space-y-1">
              <p>💰 Premiação: Sem prêmios em dinheiro</p>
              <p>🎯 Participação: Livre (todos os usuários podem participar)</p>
              <p className="text-xs text-green-600 mt-1">
                💡 Competições diárias focam no engajamento dos usuários
              </p>
            </div>
          </div>
        )}

        {!isDailyCompetition && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <Label className="text-sm font-medium text-green-800">Configurações Automáticas</Label>
            <div className="text-sm text-green-700 mt-1 space-y-1">
              <p>💰 Premiação Total: R$ {paymentData.calculateTotalPrize().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p>🎯 Participação: Livre (todos os usuários podem participar)</p>
              <p className="text-xs text-green-600 mt-1">
                💡 A premiação é calculada automaticamente com base na configuração de prêmios abaixo
              </p>
            </div>
          </div>
        )}
      </div>

      {!isDailyCompetition && <PrizeConfigurationSection paymentData={paymentData} />}

      <CompetitionEditActions isLoading={isLoading} onCancel={onClose} />
    </form>
  );
};
