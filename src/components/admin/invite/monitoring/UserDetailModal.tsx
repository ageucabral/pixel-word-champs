
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Users, 
  AlertTriangle, 
  Trophy, 
  Calendar,
  Activity,
  Fingerprint
} from 'lucide-react';

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

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MonitoringUser;
  getSuspicionLevel: (score: number) => { level: string; color: string; label: string };
}

export const UserDetailModal = ({
  isOpen,
  onClose,
  user,
  getSuspicionLevel
}: UserDetailModalProps) => {
  const suspicion = getSuspicionLevel(user.suspicion_score);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-bold">{user.username}</div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Badge variant={user.is_banned ? "destructive" : "secondary"}>
                  {user.is_banned ? "Banido" : "Ativo"}
                </Badge>
                <Badge variant={suspicion.color as any}>
                  {suspicion.label} ({user.suspicion_score})
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo das Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Indicações</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.total_invites}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processadas</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{user.processed_invites}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                <Trophy className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.total_rewards}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Suspeita</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  user.suspicion_score >= 70 ? 'text-red-600' : 
                  user.suspicion_score >= 40 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {user.suspicion_score}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações de Banimento */}
          {user.is_banned && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Usuário Banido
                </CardTitle>
              </CardHeader>
              <CardContent className="text-red-700">
                <p><strong>Data do Banimento:</strong> {formatDate(user.banned_at!)}</p>
                {user.ban_reason && (
                  <p><strong>Motivo:</strong> {user.ban_reason}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs com Detalhes */}
          <Tabs defaultValue="invited-users" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="invited-users">Usuários Indicados</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="fraud-analysis">Análise de Fraude</TabsTrigger>
            </TabsList>

            <TabsContent value="invited-users" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Indicados ({user.invited_users.length})</CardTitle>
                  <CardDescription>
                    Lista completa de usuários indicados por {user.username}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.invited_users.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Nenhum usuário indicado</p>
                  ) : (
                    <div className="space-y-3">
                      {user.invited_users.map((invitedUser, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-sm font-medium">
                              {invitedUser.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{invitedUser.username}</div>
                              <div className="text-sm text-slate-600">
                                Indicado em {formatDateShort(invitedUser.invite_date)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{invitedUser.total_score} pontos</div>
                            <div className="text-xs text-slate-600">{invitedUser.games_played} jogos</div>
                            <div className="text-xs text-slate-500">
                              {invitedUser.days_played || 0} dias ativos
                              {(invitedUser.days_played || 0) < 5 && (
                                <span className="ml-1 text-orange-600">
                                  ({5 - (invitedUser.days_played || 0)} para recompensa completa)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline de Indicações</CardTitle>
                  <CardDescription>
                    Histórico cronológico das indicações realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.invite_timeline.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Nenhuma indicação registrada</p>
                  ) : (
                    <div className="space-y-3">
                      {user.invite_timeline
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((event, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border-l-2 border-blue-200 bg-blue-50">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-medium">Indicou {event.invited_user}</div>
                            <div className="text-sm text-slate-600">{formatDate(event.date)}</div>
                          </div>
                          <Badge variant={event.status === 'used' ? 'default' : 'secondary'}>
                            {event.status === 'used' ? 'Usado' : 'Pendente'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fraud-analysis" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5" />
                    Análise de Fraude
                  </CardTitle>
                  <CardDescription>
                    Indicadores de comportamento suspeito e análise de risco
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Indicadores de Risco</h4>
                      <div className="space-y-2 text-sm">
                        {user.total_invites >= 20 && (
                          <div className="flex justify-between p-2 bg-yellow-50 rounded">
                            <span>Alto volume de indicações</span>
                            <span className="font-medium text-yellow-700">+{user.total_invites >= 50 ? '20' : '10'}</span>
                          </div>
                        )}
                        
                        {user.invited_users.filter(u => u.games_played === 0).length / user.total_invites > 0.5 && (
                          <div className="flex justify-between p-2 bg-red-50 rounded">
                            <span>Muitos usuários inativos</span>
                            <span className="font-medium text-red-700">+{
                              user.invited_users.filter(u => u.games_played === 0).length / user.total_invites >= 0.8 ? '40' : '20'
                            }</span>
                          </div>
                        )}
                        
                        {user.suspicion_score < 20 && (
                          <div className="p-2 bg-green-50 rounded text-green-700">
                            <span>Comportamento normal detectado</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Dados do Dispositivo</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 text-slate-400" />
                          <span>Fingerprint: {user.device_fingerprint || 'Não coletado'}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Integração com FingerprintJS em desenvolvimento
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recomendações */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Recomendações</h4>
                    <div className="text-sm space-y-1">
                      {user.suspicion_score >= 70 ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                          ⚠️ <strong>Alto risco:</strong> Recomenda-se investigação imediata e possível banimento
                        </div>
                      ) : user.suspicion_score >= 40 ? (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                          ⚡ <strong>Médio risco:</strong> Monitorar atividade e investigar padrões
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800">
                          ✅ <strong>Baixo risco:</strong> Comportamento dentro do esperado
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
