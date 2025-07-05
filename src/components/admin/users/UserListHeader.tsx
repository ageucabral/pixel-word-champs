
import React, { useState } from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Download, Loader2 } from 'lucide-react';
import { AllUsersData } from '@/hooks/useUsersQuery';
import { exportUsersToCSV } from '@/utils/csvExport';
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';

interface UserListHeaderProps {
  userCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  users: AllUsersData[];
}

export const UserListHeader = ({ 
  userCount, 
  searchTerm, 
  onSearchChange,
  users
}: UserListHeaderProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Exportar os usuários
      exportUsersToCSV(users, 'usuarios_sistema');
      
      toast({
        title: "Exportação concluída",
        description: `${users.length} usuários exportados com sucesso.`,
      });
    } catch (error) {
      logger.error('Erro na exportação:', { error }, 'USER_LIST_HEADER');
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados dos usuários.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Users className="h-5 w-5 text-blue-600" />
          Lista de Usuários
          <span className="text-sm font-normal text-slate-600">
            ({userCount} usuários)
          </span>
        </CardTitle>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={isExporting || users.length === 0}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </CardHeader>
  );
};
