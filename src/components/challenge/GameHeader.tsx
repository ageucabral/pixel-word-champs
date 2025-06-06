
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target } from 'lucide-react';

interface GameHeaderProps {
  onBack: () => void;
  currentLevel: number;
  timeRemaining: number;
  score: number;
}

const GameHeader = ({ onBack, currentLevel, timeRemaining, score }: GameHeaderProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
          
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1">
            <Target className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Nível {currentLevel}/20</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
