
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Filter } from 'lucide-react';

interface InviteMonitoringFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'banned' | 'suspicious';
  onStatusFilterChange: (value: 'all' | 'active' | 'banned' | 'suspicious') => void;
  minInvites: number;
  onMinInvitesChange: (value: number) => void;
  onlyWithInvites: boolean;
  onOnlyWithInvitesChange: (value: boolean) => void;
}

export const InviteMonitoringFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  minInvites,
  onMinInvitesChange,
  onlyWithInvites,
  onOnlyWithInvitesChange
}: InviteMonitoringFiltersProps) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-600" />
        <h3 className="font-medium text-slate-900">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Busca por usuário */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar Usuário</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              id="search"
              placeholder="Nome do usuário..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtro por status */}
        <div className="space-y-2">
          <Label>Status do Usuário</Label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="banned">Banidos</SelectItem>
              <SelectItem value="suspicious">Suspeitos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Número mínimo de indicações */}
        <div className="space-y-2">
          <Label htmlFor="minInvites">Mín. Indicações</Label>
          <Input
            id="minInvites"
            type="number"
            min="0"
            placeholder="0"
            value={minInvites || ''}
            onChange={(e) => onMinInvitesChange(parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Filtro apenas com indicações */}
        <div className="space-y-2">
          <Label htmlFor="onlyWithInvites">Apenas com Indicações</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="onlyWithInvites"
              checked={onlyWithInvites}
              onCheckedChange={onOnlyWithInvitesChange}
            />
            <span className="text-sm text-slate-600">
              {onlyWithInvites ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Mostra apenas usuários com indicações
          </p>
        </div>
      </div>
    </div>
  );
};
