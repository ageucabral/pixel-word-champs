
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface CompetitionStatusBadgeProps {
  status: 'scheduled' | 'active' | 'completed';
  isRealTime?: boolean;
}

export const CompetitionStatusBadge: React.FC<CompetitionStatusBadgeProps> = ({ 
  status, 
  isRealTime = false 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          text: 'Ativo',
          className: 'bg-green-100 text-green-700 border-green-200 animate-pulse',
          indicator: '🟢'
        };
      case 'scheduled':
        return {
          text: 'Agendado',
          className: 'bg-blue-100 text-blue-700 border-blue-200',
          indicator: '⏰'
        };
      case 'completed':
        return {
          text: 'Finalizado',
          className: 'bg-gray-100 text-gray-700 border-gray-200',
          indicator: '🏁'
        };
      default:
        return {
          text: 'Rascunho',
          className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          indicator: '📝'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={`${config.className} flex items-center gap-1`}>
      <span>{config.indicator}</span>
      {config.text}
      {isRealTime && status === 'active' && (
        <span className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
      )}
    </Badge>
  );
};
