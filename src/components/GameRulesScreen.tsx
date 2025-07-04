
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, Trophy, Target, Zap, Star, Award, Timer, AlertCircle } from 'lucide-react';

interface GameRulesScreenProps {
  onBack: () => void;
  onStartGame: () => void;
}

const GameRulesScreen = ({
  onBack,
  onStartGame
}: GameRulesScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-3">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header compacto */}
        <div className="flex items-center justify-between pt-1 animate-fade-in">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="rounded-full h-8 w-8 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white hover-scale"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold text-slate-800">Como Jogar</h1>
          <div className="w-8"></div>
        </div>

        {/* Hero Card compacto */}
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg animate-scale-in">
          <CardContent className="p-3 text-center relative">
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex justify-center items-center gap-1 mb-1.5">
                <Trophy className="w-5 h-5" />
                <Star className="w-4 h-4" />
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold mb-0.5">Caça-Palavras</h2>
              <p className="text-violet-100 text-xs">20 níveis de pura diversão</p>
            </div>
          </CardContent>
        </Card>

        {/* Grid de regras 2x2 compacto */}
        <div className="grid grid-cols-2 gap-2.5 animate-fade-in">
          {/* Objetivo */}
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-sm hover-scale">
            <CardContent className="p-2.5">
              <div className="text-center">
                <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-800 text-xs mb-1">Encontre Palavras</h3>
                <p className="text-xs text-slate-600 leading-tight">
                  Em qualquer direção: horizontal, vertical ou diagonal
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tempo */}
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-sm hover-scale">
            <CardContent className="p-2.5">
              <div className="text-center">
                <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-800 text-xs mb-1">1 Minuto</h3>
                <p className="text-xs text-slate-600 leading-tight">
                  Por nível. Seja rápido e estratégico!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Power-ups */}
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-sm hover-scale">
            <CardContent className="p-2.5">
              <div className="text-center">
                <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-slate-800 text-xs mb-1">Dicas & Revive</h3>
                <p className="text-xs text-slate-600 leading-tight">
                  Destaque palavras ou ganhe +30s
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progressão */}
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-sm hover-scale">
            <CardContent className="p-2.5">
              <div className="text-center">
                <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1.5">
                  <Trophy className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-800 text-xs mb-1">20 Níveis</h3>
                <p className="text-xs text-slate-600 leading-tight">
                  Dificuldade crescente a cada fase
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regra importante compacta */}
        <Card className="border-0 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 animate-fade-in">
          <CardContent className="p-2.5">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-3 h-3 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 text-xs mb-1">Regra Importante</h3>
                <p className="text-xs text-amber-700 leading-tight">
                  Os pontos só são contabilizados se você completar o nível encontrando todas as 5 palavras!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas compactas */}
        <div className="grid grid-cols-3 gap-2 animate-fade-in">
          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 text-center hover-scale">
            <CardContent className="p-2">
              <div className="text-lg font-bold text-emerald-700">20</div>
              <div className="text-xs text-emerald-600">Níveis</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 text-center hover-scale">
            <CardContent className="p-2">
              <div className="text-lg font-bold text-blue-700">1</div>
              <div className="text-xs text-blue-600">Minuto</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 text-center hover-scale">
            <CardContent className="p-2">
              <div className="text-lg font-bold text-purple-700">∞</div>
              <div className="text-xs text-purple-600">Diversão</div>
            </CardContent>
          </Card>
        </div>

        {/* Botão de ação principal */}
        <Button 
          onClick={onStartGame} 
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-base py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0 hover-scale animate-scale-in"
        >
          <div className="flex items-center justify-center gap-2">
            <Timer className="w-5 h-5" />
            COMEÇAR AGORA
          </div>
        </Button>
        
        <p className="text-center text-xs text-slate-500 animate-fade-in">
          Boa sorte no desafio! 🎯
        </p>
      </div>
    </div>
  );
};

export default GameRulesScreen;
