
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
    <CardHeader className="flex flex-col space-y-3 pb-4">
      <div className="flex flex-row items-start justify-between">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg truncate">Informações Pessoais</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie seus dados pessoais e informações de contato
          </p>
        </div>
        
        {/* Mobile: Ícone mais visível no canto */}
        <div className="sm:hidden">
          {!isEditing ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onStartEdit}
              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
            >
              <Edit className="w-5 h-5" />
            </Button>
          ) : null}
        </div>
      </div>
      
      {/* Mobile: Botões de ação em linha completa quando editando */}
      <div className="sm:hidden">
        {!isEditing ? (
          <Button
            variant="outline"
            onClick={onStartEdit}
            className="w-full flex items-center justify-center gap-2 py-3"
          >
            <Edit className="w-4 h-4" />
            Editar Informações
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancelEdit}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              onClick={onSave}
              disabled={!canSave || isLoading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </div>

      {/* Desktop: Layout original na mesma linha */}
      <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:-mt-3">
        <div></div> {/* Spacer */}
        <div className="flex gap-2 shrink-0">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onStartEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancelEdit}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={!canSave || isLoading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </div>
      </div>
    </CardHeader>
  );
};

export default DataSectionHeader;
