import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Search, Filter, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyCompetitionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  dateFilter: Date | null;
  onDateChange: (date: Date | null) => void;
  onClearFilters: () => void;
  totalCompetitions: number;
  filteredCount: number;
}

export const DailyCompetitionFilters: React.FC<DailyCompetitionFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  onClearFilters,
  totalCompetitions,
  filteredCount
}) => {
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateFilter;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header dos filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          <span className="text-sm text-gray-500">
            ({filteredCount} de {totalCompetitions} competições)
          </span>
        </div>
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Controles de filtro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Busca por título */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Buscar por título
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Digite o título da competição..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Filtro por status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Status
          </label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="scheduled">Agendada</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="completed">Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por data */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Data específica
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? (
                  format(dateFilter, "dd/MM/yyyy", { locale: ptBR })
                ) : (
                  <span className="text-gray-500">Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="start">
              <Calendar
                mode="single"
                selected={dateFilter || undefined}
                onSelect={(date) => onDateChange(date || null)}
                locale={ptBR}
                initialFocus
              />
              {dateFilter && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDateChange(null)}
                    className="w-full"
                  >
                    Limpar data
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};