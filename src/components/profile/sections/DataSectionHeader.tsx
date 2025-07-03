
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save, X } from 'lucide-react';

interface DataSectionHeaderProps {
  isEditing: boolean;
  isLoading: boolean;
  isValidUsername: (username: string) => boolean;
  editUsername: string;
  canSave: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
}

const DataSectionHeader = ({
  isEditing,
  isLoading,
  canSave,
  onStartEdit,
  onCancelEdit,
  onSave
}: DataSectionHeaderProps) => {
  return (
    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
      <div className="flex-1 min-w-0">
        <CardTitle className="text-lg truncate">Informações Pessoais</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie seus dados pessoais e informações de contato
        </p>
      </div>
      
      <div className="flex gap-2 shrink-0">
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onStartEdit}
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelEdit}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancelar</span>
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={!canSave || isLoading}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{isLoading ? 'Salvando...' : 'Salvar'}</span>
            </Button>
          </>
        )}
      </div>
    </CardHeader>
  );
};

export default DataSectionHeader;
