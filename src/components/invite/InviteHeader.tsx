import React from 'react';
import { Gift } from 'lucide-react';

const InviteHeader = () => {
  return (
    <div className="text-white rounded-2xl p-4 mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="flex items-center gap-3">
        <Gift className="w-6 h-6" />
        <div>
          <h1 className="text-lg font-bold">Convide Amigos</h1>
          <p className="text-white/80 text-sm">Ganhe pontos convidando seus amigos</p>
        </div>
      </div>
    </div>
  );
};

export default InviteHeader;