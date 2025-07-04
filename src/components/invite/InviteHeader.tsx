import React from 'react';
import { Gift, Users } from 'lucide-react';

const InviteHeader = () => {
  return (
    <header className="text-white relative mb-4" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="flex items-center justify-between p-4">
        <div className="p-2">
          <Users className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold">Convidar</h1>
        <div className="p-2">
          <Gift className="w-5 h-5 text-yellow-300" />
        </div>
      </div>
      
      {/* Invite Info */}
      <div className="px-4 pb-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">Convide Amigos</h2>
          <p className="text-sm text-white/90">
            Ganhe pontos convidando seus amigos para jogar
          </p>
        </div>
      </div>
    </header>
  );
};

export default InviteHeader;