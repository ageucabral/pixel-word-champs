
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from 'lucide-react';
import { formatBrasiliaDate, getCurrentBrasiliaDate } from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface ScheduleSectionProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  competitionType: string;
}

export const ScheduleSection = ({
  formData,
  onInputChange,
  competitionType
}: ScheduleSectionProps) => {
  logger.info('📅 BRASÍLIA: ScheduleSection renderizando com tipo:', { competitionType }, 'SCHEDULE_SECTION');
  
  const handleDateChange = (field: string, value: string) => {
    logger.info(`📅 BRASÍLIA: Data alterada - ${field}:`, { value }, 'SCHEDULE_SECTION');
    logger.info('📅 BRASÍLIA: Valor será processado em horário de Brasília', undefined, 'SCHEDULE_SECTION');
    onInputChange(field, value);
  };

  const handleTimeChange = (value: string) => {
    logger.info('🕐 BRASÍLIA: Horário alterado:', { value }, 'SCHEDULE_SECTION');
    onInputChange('startTime', value);
  };

  // Extrair apenas a data da startDate se existir
  const getDateOnly = (dateTime: string) => {
    if (!dateTime) return '';
    if (dateTime.includes('T')) {
      return dateTime.split('T')[0];
    }
    return dateTime;
  };

  // Pegar horário do formData.startTime ou usar padrão
  const getTimeValue = () => {
    return formData.startTime || '08:00';
  };

  const currentBrasiliaTime = formatBrasiliaDate(getCurrentBrasiliaDate());

  if (competitionType === 'daily') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Agendamento da Competição Diária (Brasília)</h3>
        
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-blue-700">
            ⏰ Horário atual em Brasília: <strong>{currentBrasiliaTime}</strong>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data da Competição</Label>
            <Input 
              id="startDate" 
              type="date" 
              value={getDateOnly(formData.startDate)} 
              onChange={e => handleDateChange('startDate', e.target.value)} 
              className="w-full" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário de Início (Brasília)
            </Label>
            <Input 
              id="startTime" 
              type="time" 
              value={getTimeValue()} 
              onChange={e => handleTimeChange(e.target.value)} 
              className="w-full" 
            />
            <p className="text-xs text-blue-600">
              🇧🇷 Horário de Brasília (UTC-3)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Período da Competição Semanal (Brasília)</h3>
      
      <div className="bg-blue-50 p-3 rounded-lg mb-4">
        <p className="text-sm text-blue-700">
          ⏰ Horário atual em Brasília: <strong>{currentBrasiliaTime}</strong>
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input 
              id="startDate" 
              type="date" 
              value={getDateOnly(formData.startDate)} 
              onChange={e => handleDateChange('startDate', e.target.value)} 
              className="w-full" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="startTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário de Início (Brasília)
            </Label>
            <Input 
              id="startTime" 
              type="time" 
              value={getTimeValue()} 
              onChange={e => handleTimeChange(e.target.value)} 
              className="w-full" 
            />
            <p className="text-xs text-blue-600">
              🇧🇷 Horário de Brasília (UTC-3)
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">Data de Término</Label>
          <Input 
            id="endDate" 
            type="date" 
            value={getDateOnly(formData.endDate)} 
            onChange={e => handleDateChange('endDate', e.target.value)} 
            className="w-full" 
          />
          <p className="text-xs text-slate-500">
            Horário de fim: <strong>23:59:59 (Brasília)</strong> (automático)
          </p>
        </div>
      </div>
    </div>
  );
};
