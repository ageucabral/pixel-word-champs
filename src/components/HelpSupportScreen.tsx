
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Star, HelpCircle, Bug } from 'lucide-react';
import ReportBugScreen from './ReportBugScreen';
import BasicTutorialScreen from './BasicTutorialScreen';
import AdvancedStrategiesScreen from './AdvancedStrategiesScreen';
import RankingSystemScreen from './RankingSystemScreen';

interface HelpSupportScreenProps {
  onBack: () => void;
}

const HelpSupportScreen = ({ onBack }: HelpSupportScreenProps) => {
  const [currentScreen, setCurrentScreen] = useState<'help' | 'bug' | 'basic' | 'advanced' | 'ranking'>('help');

  const faqs = [
    {
      question: "Como funciona a pontuação?",
      answer: "Palavras de 3 letras = 1 ponto, 4 letras = 2 pontos, 5 letras = 3 pontos, 6+ letras = 5+ pontos"
    },
    {
      question: "Posso jogar um desafio mais de uma vez?",
      answer: "Não, cada desafio só pode ser jogado uma vez por dia para manter a competição justa"
    },
    {
      question: "Como funcionam as dicas?",
      answer: "Você tem 1 dica gratuita por nível. Assista um anúncio para revelar uma palavra no tabuleiro"
    },
    {
      question: "O que é o sistema de revive?",
      answer: "Assista anúncios para ganhar +30 segundos extras em qualquer nível, quantas vezes quiser"
    }
  ];

  if (currentScreen === 'bug') {
    return <ReportBugScreen onBack={() => setCurrentScreen('help')} />;
  }

  if (currentScreen === 'basic') {
    return <BasicTutorialScreen onBack={() => setCurrentScreen('help')} />;
  }

  if (currentScreen === 'advanced') {
    return <AdvancedStrategiesScreen onBack={() => setCurrentScreen('help')} />;
  }

  if (currentScreen === 'ranking') {
    return <RankingSystemScreen onBack={() => setCurrentScreen('help')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-purple-800">Ajuda e Suporte</h1>
            <p className="text-sm text-purple-600">Tire suas dúvidas</p>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Precisa de Ajuda?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              size="lg"
              onClick={() => setCurrentScreen('bug')}
            >
              <Bug className="w-5 h-5 mr-3" />
              Reportar Bug
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              Perguntas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                <h3 className="font-medium text-gray-800 mb-2">{faq.question}</h3>
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tutorial */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Tutorial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setCurrentScreen('basic')}
              >
                Como jogar - Básico
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setCurrentScreen('advanced')}
              >
                Estratégias avançadas
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setCurrentScreen('ranking')}
              >
                Sistema de ranking
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-lg">Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Bug className="w-4 h-4" />
              <span>Para bugs, use o formulário de report</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Caça Palavras Royale v1.0.0</p>
          <p>Feito com ❤️ para gamers brasileiros</p>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportScreen;
