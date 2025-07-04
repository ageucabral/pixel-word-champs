import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import MonthlyRankingTable from '@/components/invite/MonthlyRankingTable';

const MonthlyRanking = () => {
  const navigate = useNavigate();
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Ranking Mensal
            </h1>
            <p className="text-sm text-slate-600">
              Competição de {currentMonth}
            </p>
          </div>
        </div>

        {/* Ranking Table */}
        <MonthlyRankingTable />
      </div>
    </div>
  );
};

export default MonthlyRanking;