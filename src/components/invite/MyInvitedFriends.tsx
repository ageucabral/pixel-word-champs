
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, CheckCircle, Clock, UserPlus } from 'lucide-react';

interface InvitedFriend {
  name: string;
  status: 'Ativo' | 'Parcialmente Ativo' | 'Pendente';
  reward: number;
  level: number;
  avatar_url?: string;
  total_score: number;
  games_played: number;
  invited_at: string;
  activated_at?: string;
  days_played?: number;
}

interface MyInvitedFriendsProps {
  invitedFriends: InvitedFriend[];
}

const MyInvitedFriends = ({ invitedFriends }: MyInvitedFriendsProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-700';
      case 'Parcialmente Ativo':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <CheckCircle className="w-3 h-3" />;
      case 'Parcialmente Ativo':
        return <Clock className="w-3 h-3" />;
      default:
        return <UserPlus className="w-3 h-3" />;
    }
  };

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
          <Users className="w-5 h-5" />
          Meus Convites ({invitedFriends.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invitedFriends.length > 0 ? (
          <div className="space-y-3">
            {invitedFriends.map((friend, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt={friend.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        friend.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{friend.name}</p>
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${getStatusColor(friend.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(friend.status)}
                        {friend.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-purple-600">+{friend.reward}</span>
                    </div>
                  </div>
                </div>
                
                {/* Informações resumidas */}
                <div className="mt-2 text-xs text-gray-500">
                  {friend.games_played} jogos • {friend.total_score} pontos
                  {friend.status === 'Parcialmente Ativo' && friend.days_played && (
                    <span> • {friend.days_played}/5 dias ativos</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-medium text-sm mb-1">Nenhum convite ainda</p>
            <p className="text-xs">Convide amigos para ganhar XP!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyInvitedFriends;
