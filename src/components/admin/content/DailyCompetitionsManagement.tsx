import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Clock, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDailyCompetitionFinalization } from "@/hooks/useDailyCompetitionFinalization";
import { DailyCompetitionForm } from './daily/DailyCompetitionForm';
import { DailyCompetitionStats } from './daily/DailyCompetitionStats';
import { DailyCompetitionTable } from './daily/DailyCompetitionTable';
import { createBrasiliaStartOfDay, createBrasiliaEndOfDay, formatBrasiliaTime } from '@/utils/brasiliaTime';

interface DailyCompetition {
  id: string;
  title: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: string;
  created_at: string;
}

export const DailyCompetitionsManagement = () => {
  // Usar o hook de finalização automática
  useDailyCompetitionFinalization();

  const [competitions, setCompetitions] = useState<DailyCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<DailyCompetition | null>(null);
  const [newCompetition, setNewCompetition] = useState({
    title: '',
    description: '',
    theme: '',
    start_date: '',
    end_date: '',
    max_participants: 0, // Sem limite - valor 0 significa ilimitado
    start_time: '00:00' // Adicionar campo de horário
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCompetitions();
  }, []);

  // Função para garantir que a data de fim seja sempre 23:59:59.999 do mesmo dia em Brasília
  const ensureEndOfDay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const endOfDay = createBrasiliaEndOfDay(date);
    
    console.log('📅 Ajustando fim do dia (Brasília):', formatBrasiliaTime(endOfDay));
    
    return endOfDay.toISOString();
  };

  // Função para definir o início do dia como 00:00:00.000 em Brasília
  const ensureStartOfDay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const startOfDay = createBrasiliaStartOfDay(date);
    
    console.log('📅 Ajustando início do dia (Brasília):', formatBrasiliaTime(startOfDay));
    
    return startOfDay.toISOString();
  };

  // Função para combinar data e horário em Brasília
  const combineDateTime = (dateString: string, timeString: string = '00:00'): string => {
    if (!dateString) return '';
    
    // Criar data local com o horário especificado
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(dateString + 'T00:00:00');
    date.setHours(hours, minutes, 0, 0);
    
    // Converter para horário de Brasília (UTC-3)
    const brasiliaOffset = -3; // Brasília é UTC-3
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const brasiliaTime = new Date(utcTime + (brasiliaOffset * 3600000));
    
    console.log('📅 Combinando data e horário (Brasília):', {
      date: dateString,
      time: timeString,
      result: brasiliaTime.toISOString()
    });
    
    return brasiliaTime.toISOString();
  };

  const handleStartDateChange = (value: string) => {
    const startTime = newCompetition.start_time || '00:00';
    const adjustedStartDate = combineDateTime(value, startTime);
    const adjustedEndDate = ensureEndOfDay(value);
    
    if (editingCompetition) {
      setEditingCompetition({
        ...editingCompetition, 
        start_date: adjustedStartDate,
        end_date: adjustedEndDate
      });
    } else {
      setNewCompetition({
        ...newCompetition, 
        start_date: adjustedStartDate,
        end_date: adjustedEndDate
      });
    }
  };

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_competitions')
        .select('*')
        .eq('competition_type', 'challenge')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match our interface
      const mappedCompetitions: DailyCompetition[] = (data || []).map(comp => ({
        id: comp.id,
        title: comp.title,
        description: comp.description || '',
        theme: comp.theme || 'Geral',
        start_date: comp.start_date,
        end_date: comp.end_date,
        max_participants: comp.max_participants || 0, // 0 = ilimitado
        status: comp.status || 'draft',
        created_at: comp.created_at
      }));
      
      setCompetitions(mappedCompetitions);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as competições diárias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addCompetition = async () => {
    try {
      // Combinar data e horário para o início
      const startTime = newCompetition.start_time || '00:00';
      const adjustedStartDate = combineDateTime(newCompetition.start_date, startTime);
      const adjustedEndDate = ensureEndOfDay(newCompetition.start_date);

      const adjustedCompetition = {
        ...newCompetition,
        start_date: adjustedStartDate,
        end_date: adjustedEndDate,
        competition_type: 'challenge',
        status: 'active',
        max_participants: 0
      };

      console.log('🎯 Criando competição diária com horário personalizado:', {
        start: adjustedCompetition.start_date,
        end: adjustedCompetition.end_date,
        start_time: startTime,
        max_participants: 'ILIMITADO'
      });

      const { error } = await supabase
        .from('custom_competitions')
        .insert([adjustedCompetition]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Competição diária criada das ${startTime} às 23:59:59 (PARTICIPAÇÃO LIVRE)`
      });

      setNewCompetition({
        title: '',
        description: '',
        theme: '',
        start_date: '',
        end_date: '',
        max_participants: 0,
        start_time: '00:00'
      });
      setIsAddModalOpen(false);
      fetchCompetitions();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a competição diária",
        variant: "destructive"
      });
    }
  };

  const updateCompetition = async () => {
    if (!editingCompetition) return;

    try {
      // Para competições diárias, SEMPRE garantir que seja o dia completo
      const updateData = {
        title: editingCompetition.title,
        description: editingCompetition.description,
        theme: editingCompetition.theme,
        start_date: ensureStartOfDay(editingCompetition.start_date),
        end_date: ensureEndOfDay(editingCompetition.start_date), // Garantir 23:59:59 do mesmo dia
        max_participants: 0, // Forçar participação livre
        status: editingCompetition.status
      };

      console.log('🔧 Atualizando competição diária com PARTICIPAÇÃO LIVRE:', {
        start: updateData.start_date,
        end: updateData.end_date,
        max_participants: 'ILIMITADO'
      });

      const { error } = await supabase
        .from('custom_competitions')
        .update(updateData)
        .eq('id', editingCompetition.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Competição diária atualizada (PARTICIPAÇÃO LIVRE: 00:00:00 às 23:59:59)"
      });

      setEditingCompetition(null);
      fetchCompetitions();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a competição diária",
        variant: "destructive"
      });
    }
  };

  const deleteCompetition = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_competitions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Competição diária removida com sucesso"
      });

      fetchCompetitions();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a competição diária",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (competition: DailyCompetition) => {
    setEditingCompetition(competition);
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Competições Diárias
            </CardTitle>
            <p className="text-sm text-slate-600">
              Gerencie competições diárias com temas específicos.
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <Clock className="h-3 w-3" />
              ✅ PADRÃO: Todas as competições duram 00:00:00 às 23:59:59 do mesmo dia
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Users className="h-3 w-3" />
              🎉 PARTICIPAÇÃO LIVRE: Sem limite de participantes!
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <Target className="h-3 w-3" />
              Pontos são automaticamente transferidos para a competição semanal
            </div>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Competição Diária
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Estatísticas */}
        <DailyCompetitionStats competitions={competitions} />

        {/* Tabela de competições */}
        <DailyCompetitionTable
          competitions={competitions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={deleteCompetition}
        />

        {/* Modals */}
        <DailyCompetitionForm
          isOpen={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          competition={null}
          newCompetition={newCompetition}
          onNewCompetitionChange={setNewCompetition}
          onSubmit={addCompetition}
          isEditing={false}
          handleStartDateChange={handleStartDateChange}
        />

        <DailyCompetitionForm
          isOpen={!!editingCompetition}
          onOpenChange={() => setEditingCompetition(null)}
          competition={editingCompetition}
          newCompetition={newCompetition}
          onNewCompetitionChange={setEditingCompetition}
          onSubmit={updateCompetition}
          isEditing={true}
          handleStartDateChange={handleStartDateChange}
        />
      </CardContent>
    </Card>
  );
};
