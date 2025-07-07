
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Award, Star } from 'lucide-react';
import { User } from '@/types';

interface ProfileStatsGridProps {
  user: User | null;
}

const ProfileStatsGrid = ({ user }: ProfileStatsGridProps) => {
  const stats = [
    { 
      label: 'Jogos', 
      value: user?.games_played?.toString() || '0', 
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'Melhor Posição Semanal', 
      value: user?.best_weekly_position ? `#${user.best_weekly_position}` : '-', 
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <div className={`w-10 h-10 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-600">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileStatsGrid;
