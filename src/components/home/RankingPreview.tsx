
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2 } from 'lucide-react';
import { rankingQueryService } from '@/services/rankingQueryService';
import { useQuery } from '@tanstack/react-query';

interface RankingPreviewProps {
  onViewFullRanking: () => void;
}

const RankingPreview = ({ onViewFullRanking }: RankingPreviewProps) => {
  const { data: ranking = [], isLoading } = useQuery({
    queryKey: ['ranking-preview'],
    queryFn: () => rankingQueryService.getWeeklyRanking(),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
  
  const topPlayers = ranking.slice(0, 3);

  return (
    <Card className="mt-8 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900">Top Players</CardTitle>
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Carregando ranking...</span>
          </div>
        ) : topPlayers.length > 0 ? (
          <div className="space-y-3">
            {topPlayers.map((player) => (
              <div key={player.user_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white shadow-sm ${
                  player.pos === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                  player.pos === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                  'bg-gradient-to-br from-orange-400 to-orange-600'
                }`}>
                  {player.pos}
                </div>
                <span className="font-medium text-gray-900 flex-1">{player.name}</span>
                <div className="text-right">
                  <div className="font-bold text-purple-600">{player.score.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum ranking disponível</p>
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full mt-4 border-purple-200 text-purple-600 hover:bg-purple-50 font-medium" 
          onClick={onViewFullRanking}
        >
          Ver Ranking Completo
        </Button>
      </CardContent>
    </Card>
  );
};

export default RankingPreview;
