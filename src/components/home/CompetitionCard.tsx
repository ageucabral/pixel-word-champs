
import React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Competition {
  id: string;
  title: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  status: string;
  prize_pool: number;
  max_participants: number;
}

interface CompetitionCardProps {
  competition: Competition;
  onStartChallenge: (challengeId: number) => void;
}

const CompetitionCard = ({ competition, onStartChallenge }: CompetitionCardProps) => {
  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Finalizada';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`;
    }
    return `${minutes}m restantes`;
  };

  const getTimeRemainingStatus = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours <= 1) return 'urgent';
    if (hours <= 6) return 'warning';
    return 'normal';
  };

  const timeStatus = getTimeRemainingStatus(competition.end_date);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50/30 border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group animate-fade-in">
      {/* Sparkle Effect Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-3 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-purple-900 transition-colors">
              {competition.title}
            </h3>
            
            {competition.theme && (
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-md hover:shadow-lg transition-shadow text-xs">
                🎯 {competition.theme}
              </Badge>
            )}
          </div>
        </div>

        {/* Time Info */}
        <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-2 mb-3 border border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${
              timeStatus === 'urgent' ? 'text-red-500 animate-pulse' : 
              timeStatus === 'warning' ? 'text-orange-500' : 'text-green-500'
            }`} />
            <div>
              <span className="text-xs text-gray-600 block">Tempo restante</span>
              <span className={`text-sm font-bold ${
                timeStatus === 'urgent' ? 'text-red-600' : 
                timeStatus === 'warning' ? 'text-orange-600' : 'text-green-600'
              }`}>
                {formatTimeRemaining(competition.end_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => onStartChallenge(parseInt(competition.id))}
          className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold text-sm py-2.5 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] group relative overflow-hidden"
        >
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          <div className="flex items-center justify-center gap-2 relative z-10">
            <span className="text-lg">🎮</span>
            <span>PARTICIPAR AGORA</span>
          </div>
        </Button>

        {/* Motivational text */}
        <p className="text-center text-xs text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          ⚡ Mostre suas habilidades e conquiste o topo!
        </p>
      </CardContent>
    </Card>
  );
};

export default CompetitionCard;
