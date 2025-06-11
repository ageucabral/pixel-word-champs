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
    max_participants: 0 // Sem limite - valor 0 significa ilimitado
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCompetitions();
  }, []);

  // CORRIGIDO: Usar as funções padronizadas de data
  const ensureEndOfDay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const endOfDay = createBrasiliaEndOfDay(date);
    
    console.log('📅 Ajustando fim do dia (Brasília - 23:59:59.999):', formatBrasiliaTime(endOfDay));
    
    return endOfDay.toISOString();
  };

  const ensureStartOfDay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const startOfDay = createBrasiliaStartOfDay(date);
    
    console.log('📅 Ajustando início do dia (Brasília - 00:00:00.000):', formatBrasiliaTime(startOfDay));
    
    return startOfDay.toISOString();
  };

  const handleStartDateChange = (value: string) => {
    const adjustedStartDate = ensureStartOfDay(value);
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
      console.error('Erro ao carregar competições:', error);
      // Removido toast de erro aqui
    } finally {
      setLoading(false);
    }
  };

  const addCompetition = async () => {
    try {
      // CORRIGIDO: Usar as funções padronizadas para garantir consistência
      const adjustedCompetition = {
        ...newCompetition,
        start_date: ensureStartOfDay(newCompetition.start_date),
        end_date: ensureEndOfDay(newCompetition.start_date), // Garantir mesmo dia
        competition_type: 'challenge',
        status: 'scheduled', // Status será calculado automaticamente
        max_participants: 0 // Participação livre
      };

      console.log('🎯 Criando competição diária com padrão corrigido:', {
        start: formatBrasiliaTime(new Date(adjustedCompetition.start_date)),
        end: formatBrasiliaTime(new Date(adjustedCompetition.end_date)),
        max_participants: 'ILIMITADO'
      });

      const { error } = await supabase
        .from('custom_competitions')
        .insert([adjustedCompetition]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Competição diária criada com sucesso"
      });

      setNewCompetition({
        title: '',
        description: '',
        theme: '',
        start_date: '',
        end_date: '',
        max_participants: 0
      });
      setIsAddModalOpen(false);
      fetchCompetitions();
    } catch (error) {
      console.error('Erro ao criar competição:', error);
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
      // CORRIGIDO: Usar as funções padronizadas
      const updateData = {
        title: editingCompetition.title,
        description: editingCompetition.description,
        theme: editingCompetition.theme,
        start_date: ensureStartOfDay(editingCompetition.start_date),
        end_date: ensureEndOfDay(editingCompetition.start_date), // Garantir mesmo dia
        max_participants: 0, // Forçar participação livre
        status: 'scheduled' // Status será calculado automaticamente
      };

      console.log('🔧 Atualizando competição diária com padrão corrigido:', {
        start: formatBrasiliaTime(new Date(updateData.start_date)),
        end: formatBrasiliaTime(new Date(updateData.end_date)),
        max_participants: 'ILIMITADO'
      });

      const { error } = await supabase
        .from('custom_competitions')
        .update(updateData)
        .eq('id', editingCompetition.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Competição diária atualizada com sucesso"
      });

      setEditingCompetition(null);
      fetchCompetitions();
    } catch (error) {
      console.error('Erro ao atualizar competição:', error);
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
      console.error('Erro ao deletar competição:', error);
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
