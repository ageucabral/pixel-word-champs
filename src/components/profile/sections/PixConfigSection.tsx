
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Eye, EyeOff } from 'lucide-react';

interface PixConfigSectionProps {
  isEditing: boolean;
  pixHolderName: string;
  pixKey: string;
  pixType: 'cpf' | 'email' | 'phone' | 'random';
  editPixHolderName: string;
  editPixKey: string;
  editPixType: 'cpf' | 'email' | 'phone' | 'random';
  showPixKey: boolean;
  onPixHolderNameChange: (value: string) => void;
  onPixKeyChange: (value: string) => void;
  onPixTypeChange: (value: 'cpf' | 'email' | 'phone' | 'random') => void;
  onToggleShowPixKey: () => void;
}

const PixConfigSection = ({
  isEditing,
  pixHolderName,
  pixKey,
  pixType,
  editPixHolderName,
  editPixKey,
  editPixType,
  showPixKey,
  onPixHolderNameChange,
  onPixKeyChange,
  onPixTypeChange,
  onToggleShowPixKey
}: PixConfigSectionProps) => {
  const getPixKeyPlaceholder = () => {
    switch (editPixType) {
      case 'cpf': return '000.000.000-00';
      case 'email': return 'seu@email.com';
      case 'phone': return '(11) 99999-9999';
      case 'random': return 'chave-aleatoria-gerada-pelo-banco';
      default: return '';
    }
  };

  return (
    <div className="border-t pt-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-green-600" />
        <h3 className="font-medium text-gray-900">Configurações PIX</h3>
      </div>
      
      {!isEditing ? (
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Nome do titular</Label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-900 text-sm break-words">{pixHolderName || 'Não configurado'}</span>
            </div>
          </div>
          <div>
            <Label className="text-sm">Chave PIX</Label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <span className="text-gray-900 text-sm break-all">{pixKey || 'Não configurado'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="pixHolderName">Nome do titular</Label>
            <Input
              id="pixHolderName"
              value={editPixHolderName}
              onChange={(e) => onPixHolderNameChange(e.target.value)}
              placeholder="Nome completo como aparece na conta"
            />
          </div>

          <div>
            <Label htmlFor="pixType" className="text-sm">Tipo de chave PIX</Label>
            <select
              id="pixType"
              value={editPixType}
              onChange={(e) => onPixTypeChange(e.target.value as any)}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="cpf">CPF</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave aleatória</option>
            </select>
          </div>

          <div>
            <Label htmlFor="pixKey" className="text-sm">Chave PIX</Label>
            <div className="relative">
              <Input
                id="pixKey"
                type={showPixKey ? "text" : "password"}
                value={editPixKey}
                onChange={(e) => onPixKeyChange(e.target.value)}
                placeholder={getPixKeyPlaceholder()}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={onToggleShowPixKey}
              >
                {showPixKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixConfigSection;
