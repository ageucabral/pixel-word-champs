
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWeeklyRanking } from '@/hooks/useWeeklyRanking';

export const WeeklyRankingHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { 
    historyData, 
    isLoading, 
    error, 
    totalPages,
    currentWeek 
  } = useWeeklyRankingHistory(currentPage);

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Histórico de Rankings Semanais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {historyData.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nenhum histórico disponível ainda</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {historyData.map((week) => (
                <Card key={`${week.week_start}-${week.week_end}`} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold">
                          Semana: {formatWeekRange(week.week_start, week.week_end)}
                        </span>
                      </div>
                      {week.week_start === currentWeek?.week_start && (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          Semana Atual
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Pos.</TableHead>
                            <TableHead>Jogador</TableHead>
                            <TableHead className="text-center">Pontos</TableHead>
                            <TableHead className="text-center">Prêmio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {week.rankings.slice(0, 10).map((ranking) => (
                            <TableRow key={ranking.id} className="hover:bg-slate-50">
                              <TableCell className="font-medium">
                                <Badge variant={ranking.position <= 3 ? "default" : "outline"}>
                                  #{ranking.position}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {ranking.username}
                              </TableCell>
                              <TableCell className="text-center">
                                {ranking.total_score.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">
                                {ranking.prize_amount > 0 ? (
                                  <span className="font-semibold text-green-600">
                                    R$ {ranking.prize_amount.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
