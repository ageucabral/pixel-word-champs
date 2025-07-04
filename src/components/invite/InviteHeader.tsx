import React from 'react';
import { Gift } from 'lucide-react';

const InviteHeader = () => {
  return (
    <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 text-white rounded-2xl p-4 mb-4">
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