
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export const WordsCount = () => {
  const { data: counts, isLoading, error, refetch } = useQuery({
    queryKey: ['wordsCount'],
    queryFn: async () => {
      console.log('🔍 Consultando contagem de palavras no banco...');
      
      // Contar palavras ativas
      const { count: activeCount, error: activeError } = await supabase
        .from('level_words')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (activeError) {
        console.error('❌ Erro ao contar palavras ativas:', activeError);
        throw activeError;
      }

      // Contar palavras inativas
      const { count: inactiveCount, error: inactiveError } = await supabase
        .from('level_words')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      if (inactiveError) {
        console.error('❌ Erro ao contar palavras inativas:', inactiveError);
        throw inactiveError;
      }

      // Contar total de palavras
      const { count: totalCount, error: totalError } = await supabase
        .from('level_words')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('❌ Erro ao contar total de palavras:', totalError);
        throw totalError;
      }

      const result = {
        active: activeCount || 0,
        inactive: inactiveCount || 0,
        total: totalCount || 0
      };

      console.log('📊 Contagem de palavras:', result);
      return result;
    },
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Erro ao consultar banco de dados</span>
          </div>
          <p className="text-xs text-red-500 mt-1">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Banco de Palavras
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm">Consultando banco...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{counts?.active}</div>
                <div className="text-xs text-green-600">Ativas</div>
              </div>
              <div className="text-center p-3 bg-red-100 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-700">{counts?.inactive}</div>
                <div className="text-xs text-red-600">Inativas</div>
              </div>
              <div className="text-center p-3 bg-blue-100 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{counts?.total}</div>
                <div className="text-xs text-blue-600">Total</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              Última atualização: {new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
