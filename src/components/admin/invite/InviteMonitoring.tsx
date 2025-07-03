
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useInviteMonitoringData } from '@/hooks/useInviteMonitoringData';
import { useUserMutations } from '@/hooks/useUserMutations';
import { InviteMonitoringTable } from './monitoring/InviteMonitoringTable';
import { InviteMonitoringFilters } from './monitoring/InviteMonitoringFilters';
import { FraudDetectionPanel } from './monitoring/FraudDetectionPanel';
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  Users, 
  Activity,
  Fingerprint,
  RefreshCw
} from 'lucide-react';

export const InviteMonitoring = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'suspicious'>('all');
  const [minInvites, setMinInvites] = useState(0);
  const [onlyWithInvites, setOnlyWithInvites] = useState(true); // Padrão: apenas usuários com indicações
  const { toast } = useToast();
  
  const { 
    data: monitoringData, 
    isLoading, 
    error, 
    refetch 
  } = useInviteMonitoringData({
    searchTerm,
    statusFilter,
    minInvites,
    onlyWithInvites
  });

  const { banUser, isBanningUser } = useUserMutations();

  const handleBanUser = async (userId: string, reason: string) => {
    try {
      await banUser({ userId, reason });
      refetch();
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
    }
  };

  const getSuspicionLevel = (score: number) => {
    if (score >= 70) return { level: 'HIGH', color: 'destructive', label: 'Alta Suspeita' };
    if (score >= 40) return { level: 'MEDIUM', color: 'warning', label: 'Média Suspeita' };
    return { level: 'LOW', color: 'secondary', label: 'Baixa Suspeita' };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Monitoramento de Indicações</h2>
            </div>
            <p className="text-slate-600">Carregando dados de monitoramento...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Erro ao Carregar Dados</h3>
        <p className="text-slate-600 mb-6">{error}</p>
        <Button onClick={refetch}>Tentar Novamente</Button>
      </div>
    );
  }

  const { users, stats } = monitoringData || { users: [], stats: {} };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Monitoramento de Indicações</h2>
          </div>
          <p className="text-slate-600">Sistema antifraude com análise de fingerprints</p>
        </div>
        <Button
          onClick={refetch}
          variant="outline"
          className="bg-white hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Usuários com Indicações
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalUsersWithInvites || 0}
            </div>
            <p className="text-xs text-slate-500">
              Usuários ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Casos Suspeitos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.highSuspicionUsers || 0}
            </div>
            <p className="text-xs text-slate-500">
              Score de suspeita ≥ 70
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Fingerprints Únicos
            </CardTitle>
            <Fingerprint className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.uniqueFingerprints || 0}
            </div>
            <p className="text-xs text-slate-500">
              Dispositivos identificados
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Indicações Fraudulentas
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.suspiciousInvites || 0}
            </div>
            <p className="text-xs text-slate-500">
              Potenciais fraudes detectadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <InviteMonitoringFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        minInvites={minInvites}
        onMinInvitesChange={setMinInvites}
        onlyWithInvites={onlyWithInvites}
        onOnlyWithInvitesChange={setOnlyWithInvites}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="h-12 p-1 bg-white border border-slate-200 shadow-sm">
          <TabsTrigger 
            value="users" 
            className="h-10 px-4 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
          >
            <Users className="h-4 w-4 mr-2" />
            Usuários ({users.length})
          </TabsTrigger>
          <TabsTrigger 
            value="fraud-detection" 
            className="h-10 px-4 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Detecção de Fraudes
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="users" className="mt-0">
            <InviteMonitoringTable
              users={users}
              onBanUser={handleBanUser}
              isBanningUser={isBanningUser}
              getSuspicionLevel={getSuspicionLevel}
            />
          </TabsContent>

          <TabsContent value="fraud-detection" className="mt-0">
            <FraudDetectionPanel
              users={users}
              stats={stats}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
