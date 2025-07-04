
import React from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import { APP_CONFIG } from '@/constants/app';

const HomeHeader = () => {
  return (
    <div className="text-center mb-8 relative">
      {/* Decorative stars */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          <Star className="w-4 h-4 text-yellow-400 animate-bounce" />
          <Sparkles className="w-4 h-4 text-pink-400 animate-bounce delay-100" />
          <Star className="w-4 h-4 text-blue-400 animate-bounce delay-200" />
        </div>
      </div>
      
      <div className="relative mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-2xl animate-pulse">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-ping delay-300"></div>
      </div>
      
      <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
        <h1 className="text-3xl font-black tracking-wide mb-2">
          {APP_CONFIG.NAME}
        </h1>
      </div>
      <p className="text-slate-600 text-base font-medium">
        🎯 Desafie-se nas competições diárias épicas
      </p>
    </div>
  );
};

export default HomeHeader;
