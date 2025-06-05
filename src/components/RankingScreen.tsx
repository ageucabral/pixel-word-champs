
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Users, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const RankingScreen = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const { user } = useAuth();

  const mockDailyRanking = [
    { pos: 1, name: "João Silva", score: 2540, avatar: "🥇" },
    { pos: 2, name: "Maria Santos", score: 2410, avatar: "🥈" },
    { pos: 3, name: "Pedro Costa", score: 2380, avatar: "🥉" },
    { pos: 4, name: "Ana Lima", score: 2250, avatar: "👤" },
    { pos: 5, name: "Carlos Souza", score: 2180, avatar: "👤" },
    { pos: 6, name: "Julia Mendes", score: 2150, avatar: "👤" },
    { pos: 7, name: "Roberto Silva", score: 2100, avatar: "👤" },
    { pos: 8, name: "Fernanda Costa", score: 2050, avatar: "👤" },
    { pos: 9, name: "Marcos Santos", score: 2020, avatar: "👤" },
    { pos: 10, name: "Patricia Lima", score: 1990, avatar: "👤" },
  ];

  const mockWeeklyRanking = [
    { pos: 1, name: "Maria Santos", score: 15420, avatar: "🥇" },
    { pos: 2, name: "João Silva", score: 14890, avatar: "🥈" },
    { pos: 3, name: "Ana Lima", score: 13750, avatar: "🥉" },
    { pos: 4, name: "Pedro Costa", score: 12980, avatar: "👤" },
    { pos: 5, name: "Carlos Souza", score: 11650, avatar: "👤" },
    { pos: 6, name: "Julia Mendes", score: 11400, avatar: "👤" },
    { pos: 7, name: "Roberto Silva", score: 11200, avatar: "👤" },
    { pos: 8, name: "Fernanda Costa", score: 10800, avatar: "👤" },
    { pos: 9, name: "Marcos Santos", score: 10500, avatar: "👤" },
    { pos: 10, name: "Patricia Lima", score: 10200, avatar: "👤" },
  ];

  const mockGlobalRanking = [
    { pos: 1, name: "João Silva", score: 45230, avatar: "🥇", games: 127 },
    { pos: 2, name: "Maria Santos", score: 43890, avatar: "🥈", games: 119 },
    { pos: 3, name: "Ana Lima", score: 41750, avatar: "🥉", games: 134 },
    { pos: 4, name: "Pedro Costa", score: 39980, avatar: "👤", games: 112 },
    { pos: 5, name: "Carlos Souza", score: 38650, avatar: "👤", games: 108 },
  ];

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-orange-500" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">{position}</span>;
    }
  };

  const renderRanking = (ranking: typeof mockDailyRanking, showGames = false) => (
    <div className="space-y-3">
      {ranking.map((player) => (
        <Card key={player.pos} className={`overflow-hidden ${
          user?.username === player.name ? 'ring-2 ring-purple-500 bg-purple-50' : ''
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankingIcon(player.pos)}
                </div>
                <div>
                  <p className={`font-medium ${
                    user?.username === player.name ? 'text-purple-700' : 'text-gray-900'
                  }`}>
                    {player.name}
                    {user?.username === player.name && ' (Você)'}
                  </p>
                  <p className="text-sm text-gray-500">
                    #{player.pos}
                    {showGames && 'games' in player && ` • ${(player as any).games} jogos`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-600">{player.score.toLocaleString()}</p>
                <p className="text-xs text-gray-500">pontos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-4 pb-20 bg-gradient-to-b from-purple-50 to-blue-50 min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-purple-800 mb-2">Rankings</h1>
        <p className="text-gray-600">Compete com jogadores do mundo todo</p>
      </div>

      {/* Sua Posição */}
      <Card className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
        <CardContent className="p-4 text-center">
          <Crown className="w-8 h-8 mx-auto mb-2" />
          <p className="text-lg font-bold">Sua Melhor Posição</p>
          <p className="text-2xl font-bold">
            {user?.bestDailyPosition ? `#${user.bestDailyPosition}` : 'Não rankeado'}
          </p>
          <p className="text-sm opacity-80">Ranking Diário</p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Diário</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Ranking Diário
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderRanking(mockDailyRanking)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="w-5 h-5 text-purple-500" />
                Ranking Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderRanking(mockWeeklyRanking)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Ranking Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderRanking(mockGlobalRanking, true)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RankingScreen;
