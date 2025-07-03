
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import DailyCompetitionCard from './DailyCompetitionCard';
import { Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

const AuthScreen = () => {
  const [activeTab, setActiveTab] = useState('login');
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirecionar usuários já autenticados
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      logger.info('Usuário já autenticado, redirecionando para home', undefined, 'AUTH_SCREEN');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-white rounded-full mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-screen">
      <div className="flex flex-col min-h-screen w-full max-w-sm mx-auto relative overflow-hidden">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 gap-1 p-4 transform rotate-12 scale-150">
            {['W', 'O', 'R', 'D', 'S', 'E', 'A', 'R'].map((letter, index) => (
              <div key={index} className="w-8 h-8 bg-white rounded border-2 border-gray-300 flex items-center justify-center text-xs font-bold">
                {letter}
              </div>
            ))}
          </div>
        </div>

        {/* Header Section - Espaçamento reduzido */}
        <div className="pt-8 pb-4 px-6 text-center relative z-10">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-2xl flex items-center justify-center mb-3 transform rotate-3">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Caça Palavras</h1>
            <h2 className="text-2xl font-bold text-yellow-400">ROYALE</h2>
            <p className="text-purple-200 text-sm mt-1">Compete e conquiste a coroa!</p>
          </div>
        </div>

        {/* Competição Diária - Nova seção */}
        <div className="px-6 relative z-10">
          <DailyCompetitionCard />
        </div>

        {/* Login Form Section - Container scrollável */}
        <div className="flex-1 px-6 relative z-10 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 rounded-xl p-1">
                <TabsTrigger value="login" className="rounded-lg">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Entrar na Arena</h3>
                  <p className="text-gray-600 text-sm">Entre e mostre suas habilidades</p>
                </div>

                <LoginForm />
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Criar Conta</h3>
                  <p className="text-gray-600 text-sm">Junte-se à competição</p>
                </div>
                
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer - Melhorado com botão dinâmico */}
        <div className="p-4 text-center relative z-10">
          {activeTab === 'login' && (
            <>
              <p className="text-purple-200 text-sm mb-3">Novo no jogo?</p>
              <button 
                onClick={() => setActiveTab('register')}
                className="w-full py-3 border-2 border-white/30 rounded-xl text-white font-bold text-base hover:bg-white/10 transition-all duration-200"
              >
                <svg className="inline mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM14 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Criar Conta Gratuita
              </button>
            </>
          )}
          
          <div className="mt-4 flex items-center justify-center space-x-6 text-purple-200">
            <Link to="/terms-of-service" className="text-xs hover:text-white transition-colors cursor-pointer">
              Termos
            </Link>
            <Link to="/privacy-policy" className="text-xs hover:text-white transition-colors cursor-pointer">
              Privacidade
            </Link>
            <span className="text-xs hover:text-white transition-colors cursor-pointer">Suporte</span>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-8 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 left-6 w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-40 right-12 w-4 h-4 bg-pink-400 rounded-full animate-pulse delay-500"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
