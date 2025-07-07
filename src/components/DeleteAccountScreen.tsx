
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Trash2, Shield, CheckCircle2 } from 'lucide-react';
import { logger } from '@/utils/logger';

interface DeleteAccountScreenProps {
  onBack: () => void;
}

const DeleteAccountScreen = ({ onBack }: DeleteAccountScreenProps) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = confirmText === 'EXCLUIR';

  const handleDelete = async () => {
    if (!isConfirmed) return;
    
    setIsDeleting(true);
    try {
      // Aqui seria implementada a lógica de exclusão
      logger.info('Processo de exclusão de conta iniciado', undefined, 'DELETE_ACCOUNT');
      await new Promise(resolve => setTimeout(resolve, 2000));
      logger.info('Conta excluída com sucesso', undefined, 'DELETE_ACCOUNT');
      onBack();
    } catch (error) {
      logger.error('Erro ao excluir conta', { error }, 'DELETE_ACCOUNT');
    } finally {
      setIsDeleting(false);
    }
  };

  const dataItems = [
    'Todas as suas pontuações e rankings',
    'Histórico de desafios completados',
    'Conquistas e estatísticas',
    'Dados de convites e amigos',
    'Configurações personalizadas'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4 w-full px-2 sm:px-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-red-800">Excluir Conta</h1>
            <p className="text-sm text-red-600">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        {/* Aviso principal */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-3 text-red-800">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              Atenção: Ação Irreversível
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-red-700 leading-relaxed">
              Uma vez excluída, sua conta e todos os dados associados serão permanentemente removidos. 
              Esta ação não pode ser desfeita.
            </p>
          </CardContent>
        </Card>

        {/* O que será perdido */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-gray-600" />
              </div>
              Dados que serão perdidos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {dataItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0 mt-2" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Confirmação */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Para confirmar, digite <span className="font-bold text-red-600">EXCLUIR</span> na caixa abaixo:
            </label>
            <div className="relative">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Digite EXCLUIR"
                className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors text-base ${
                  confirmText && !isConfirmed ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isConfirmed && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternativa */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Alternativa mais segura</p>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Considere apenas fazer logout ou entrar em contato com o suporte para desativar temporariamente sua conta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="space-y-3 pt-2">
          <Button 
            onClick={handleDelete}
            variant="destructive"
            className="w-full h-12 text-base font-medium"
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? 'Excluindo conta...' : 'Excluir Minha Conta Permanentemente'}
          </Button>
          
          <Button 
            onClick={onBack}
            variant="outline"
            className="w-full h-12 text-base font-medium"
            disabled={isDeleting}
          >
            Cancelar e Manter Conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountScreen;
