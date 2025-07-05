
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { formatDateForDisplay } from '@/utils/dateFormatters';
import { parseWinnersData, parseRankingsData, type Winner } from '@/utils/typeGuards';
import { Trophy, Calendar, DollarSign, Users, Download, Eye } from 'lucide-react';
import { logger } from '@/utils/logger';

interface CompetitionSnapshot {
  id: string;
  competition_id: string;
  start_date: string;
  end_date: string;
  total_participants: number;
  total_prize_pool: number;
  winners_data: Winner[];
  rankings_data: any[];
  finalized_at: string;
}

export const WinnersManagementTab = () => {
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<CompetitionSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CompetitionSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSnapshots();
  }, []);

  const loadSnapshots = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('weekly_competitions_snapshot')
        .select('*')
        .order('finalized_at', { ascending: false });

      if (error) throw error;

      // Parse dos dados JSONB com parsing seguro
      const parsedSnapshots = (data || []).map(item => ({
        ...item,
        winners_data: parseWinnersData(item.winners_data),
        rankings_data: parseRankingsData(item.rankings_data)
      })) as CompetitionSnapshot[];

      setSnapshots(parsedSnapshots);
    } catch (error: any) {
      logger.error('Erro ao carregar snapshots:', { error }, 'WINNERS_MANAGEMENT_TAB');
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de competições",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportWinners = (snapshot: CompetitionSnapshot) => {
    const csv = [
      ['Posição', 'Username', 'Pontuação', 'Prêmio', 'Chave PIX', 'Nome do Titular', 'Status do Pagamento'].join(','),
      ...snapshot.winners_data.map(winner => [
        winner.position,
        winner.username,
        winner.total_score,
        `R$ ${winner.prize_amount.toFixed(2)}`,
        winner.pix_key || 'N/A',
        winner.pix_holder_name || 'N/A',
        winner.payment_status
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ganhadores_${snapshot.start_date}_${snapshot.end_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação Concluída",
      description: "Arquivo CSV baixado com sucesso!",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-600">Carregando histórico de ganhadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Gerenciamento de Ganhadores
          </h2>
          <p className="text-sm text-slate-600">Histórico de competições finalizadas e seus ganhadores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Competições */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Competições Finalizadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshots.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  Nenhuma competição finalizada ainda
                </p>
              ) : (
                snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSnapshot?.id === snapshot.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSnapshot(snapshot)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-sm">
                        {formatDateForDisplay(snapshot.start_date)} - {formatDateForDisplay(snapshot.end_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {snapshot.total_participants} participantes
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        R$ {snapshot.total_prize_pool.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {snapshot.winners_data.length} ganhadores
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes da Competição Selecionada */}
        <div className="lg:col-span-2">
          {selectedSnapshot ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Competição {formatDateForDisplay(selectedSnapshot.start_date)} - {formatDateForDisplay(selectedSnapshot.end_date)}
                  </CardTitle>
                  <Button
                    onClick={() => exportWinners(selectedSnapshot)}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Finalizada em: {new Date(selectedSnapshot.finalized_at).toLocaleString('pt-BR')}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-700">{selectedSnapshot.total_participants}</div>
                      <div className="text-sm text-blue-600">Participantes</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-700">{selectedSnapshot.winners_data.length}</div>
                      <div className="text-sm text-green-600">Ganhadores</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-700">R$ {selectedSnapshot.total_prize_pool.toFixed(2)}</div>
                      <div className="text-sm text-yellow-600">Total em Prêmios</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Lista de Ganhadores</h3>
                    {selectedSnapshot.winners_data.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Nenhum ganhador registrado para esta competição
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedSnapshot.winners_data
                          .sort((a, b) => a.position - b.position)
                          .map((winner) => (
                            <div key={winner.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Badge variant={winner.position <= 3 ? "default" : "secondary"}>
                                  {winner.position}º
                                </Badge>
                                <div>
                                  <div className="font-medium">{winner.username}</div>
                                  <div className="text-sm text-gray-600">{winner.total_score} pontos</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-green-600">R$ {winner.prize_amount.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">
                                  {winner.pix_key ? `PIX: ${winner.pix_key.substring(0, 10)}...` : 'Sem PIX'}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma competição à esquerda para ver os detalhes</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
