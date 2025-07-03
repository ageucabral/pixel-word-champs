
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BanUserModal } from '@/components/admin/users/BanUserModal';
import { UserDetailModal } from './UserDetailModal';
import { 
  MoreHorizontal, 
  Ban, 
  Eye, 
  AlertTriangle,
  Users,
  Trophy,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MonitoringUser {
  id: string;
  username: string;
  avatar_url?: string;
  is_banned: boolean;
  banned_at?: string;
  ban_reason?: string;
  total_invites: number;
  processed_invites: number;
  pending_invites: number;
  total_rewards: number;
  suspicion_score: number;
  device_fingerprint?: string;
  last_invite_date?: string;
  invite_timeline: any[];
  invited_users: any[];
}

interface InviteMonitoringTableProps {
  users: MonitoringUser[];
  onBanUser: (userId: string, reason: string, adminPassword: string) => Promise<void>;
  isBanningUser: boolean;
  getSuspicionLevel: (score: number) => { level: string; color: string; label: string };
}

export const InviteMonitoringTable = ({
  users,
  onBanUser,
  isBanningUser,
  getSuspicionLevel
}: InviteMonitoringTableProps) => {
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MonitoringUser | null>(null);

  const handleBanClick = (user: MonitoringUser) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const handleDetailClick = (user: MonitoringUser) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-medium text-slate-900">Nenhum usuário encontrado</h3>
        <p className="mt-1 text-sm text-slate-500">
          Ajuste os filtros para ver mais resultados.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Indicações</TableHead>
              <TableHead>Recompensas</TableHead>
              <TableHead>Score de Suspeita</TableHead>
              <TableHead>Última Indicação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const suspicion = getSuspicionLevel(user.suspicion_score);
              
              return (
                <TableRow key={user.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage 
                          src={user.avatar_url} 
                          className="object-cover w-full h-full"
                        />
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900">
                          {user.username}
                        </div>
                        {user.is_banned && (
                          <div className="text-xs text-red-600">
                            Banido em {formatDate(user.banned_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-slate-900">
                        {user.total_invites} total
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">
                          {user.processed_invites} processadas
                        </span>
                        <span className="text-orange-600">
                          {user.pending_invites} pendentes
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">{user.total_rewards} XP</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={suspicion.color as any}
                        className="flex items-center gap-1"
                      >
                        {suspicion.level === 'HIGH' && <AlertTriangle className="w-3 h-3" />}
                        {user.suspicion_score}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {suspicion.label}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(user.last_invite_date)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={user.is_banned ? "destructive" : "secondary"}>
                      {user.is_banned ? "Banido" : "Ativo"}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleDetailClick(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        {!user.is_banned && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleBanClick(user)}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Banir Usuário
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      {selectedUser && (
        <>
          <BanUserModal
            isOpen={showBanModal}
            onClose={() => {
              setShowBanModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
          />
          
          <UserDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            getSuspicionLevel={getSuspicionLevel}
          />
        </>
      )}
    </>
  );
};
