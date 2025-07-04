
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Settings } from 'lucide-react';
import { WordsManagement } from './content/WordsManagement';
import { GameSettings } from './content/GameSettings';
import { useRealGameMetrics } from '@/hooks/useRealGameMetrics';
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Folder } from 'lucide-react';

export const GameContentTab = () => {
  const { metrics, isLoading } = useRealGameMetrics();

  const quickStats = [
    { 
      label: 'Palavras Ativas', 
      value: isLoading ? '...' : (metrics?.activeWords || 0).toLocaleString(), 
      icon: BookOpen, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Categorias Ativas', 
      value: isLoading ? '...' : (metrics?.activeCategories || 0).toString(), 
      icon: Folder, 
      color: 'text-green-600' 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-lg shadow-md">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Gestão de Conteúdo
                </h1>
                <p className="text-slate-600 mt-1 text-sm">
                  Central de controle para palavras e configurações do jogo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Métricas do Sistema</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((stat, index) => (
              <Card key={index} className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-slate-600 text-sm">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Tabs defaultValue="words" className="w-full">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <TabsList className="grid grid-cols-2 bg-white border border-slate-200">
                <TabsTrigger 
                  value="words" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  <BookOpen className="h-4 w-4" />
                  Banco de Palavras
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="flex items-center gap-2 data-[state=active]:bg-slate-50 data-[state=active]:text-slate-700"
                >
                  <Settings className="h-4 w-4" />
                  Configurações
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="words" className="space-y-6 mt-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Gerenciamento de Palavras
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Controle completo do vocabulário do jogo
                    </p>
                  </div>
                </div>
                <WordsManagement />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-slate-600" />
                      Configurações do Sistema
                    </h3>
                    <p className="text-slate-600 text-sm">
                      Ajuste regras e mecânicas do jogo
                    </p>
                  </div>
                </div>
                <GameSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
