import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { isTemporaryEmail, isValidEmail } from '@/utils/emailDetection';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { AvailabilityIndicator } from '../../auth/AvailabilityIndicator';
import { emailExchangeService } from '@/services/emailExchangeService';
import { useToast } from "@/hooks/use-toast";

interface EmailExchangeSectionProps {
  email: string;
}

const EmailExchangeSection = ({ email }: EmailExchangeSectionProps) => {
  const [isExchanging, setIsExchanging] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { toast } = useToast();
  
  const emailCheck = useEmailVerification(newEmail);
  const isTemporary = isTemporaryEmail(email);

  const handleStartExchange = () => {
    setIsExchanging(true);
    setNewEmail('');
    setVerificationSent(false);
  };

  const handleCancelExchange = () => {
    setIsExchanging(false);
    setNewEmail('');
    setVerificationSent(false);
  };

  const handleSendVerification = async () => {
    if (!isValidEmail(newEmail) || emailCheck.exists) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido que não esteja em uso.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await emailExchangeService.sendVerificationCode(newEmail);
      
      if (result.success) {
        setVerificationSent(true);
        toast({
          title: "Verificação enviada",
          description: "Verifique sua caixa de entrada e siga as instruções para confirmar o novo email.",
        });
      } else {
        toast({
          title: "Erro ao enviar verificação",
          description: result.error || "Erro inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao enviar verificação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExchanging) {
    return (
      <div className="space-y-2">
        <Label>Email</Label>
        <div className="p-3 bg-gray-50 rounded-lg border flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-gray-900 truncate text-sm">{email}</span>
            {isTemporary && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full shrink-0">
                Temporário
              </span>
            )}
          </div>
          {isTemporary && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartExchange}
              className="text-xs w-full sm:w-auto shrink-0"
            >
              Definir Email Real
            </Button>
          )}
        </div>
        {isTemporary ? (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
            <AlertDescription className="text-orange-700 text-sm">
              Este é um email temporário. Defina um email real para receber comunicações e facilitar o acesso à sua conta.
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-gray-500">Email confirmado e verificado</p>
        )}
      </div>
    );
  }

  if (verificationSent) {
    return (
      <div className="space-y-4">
        <Label>Verificação de Email</Label>
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Verificação enviada para {newEmail}</strong>
            <br />
            Verifique sua caixa de entrada e siga as instruções para confirmar o novo email.
            Após a confirmação, seu email será atualizado automaticamente.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={handleCancelExchange}
          className="w-full"
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Definir Email Real</Label>
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>Email atual: {email}</span>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              Temporário
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="newEmail">Novo Email</Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="seu@email.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className={`${
              newEmail && emailCheck.exists 
                ? 'border-red-300 bg-red-50' 
                : newEmail && emailCheck.available && isValidEmail(newEmail)
                ? 'border-green-300 bg-green-50' 
                : ''
            }`}
          />
          <AvailabilityIndicator
            checking={emailCheck.checking}
            available={emailCheck.available && isValidEmail(newEmail)}
            exists={emailCheck.exists || !isValidEmail(newEmail)}
            type="email"
            value={newEmail}
          />
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-700">
            <strong>Importante:</strong> Após definir um email real, você poderá fazer login tanto com seu telefone quanto com o novo email.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleSendVerification}
            disabled={!newEmail || !isValidEmail(newEmail) || emailCheck.exists || emailCheck.checking || isLoading}
            className="flex-1 text-sm"
          >
            {isLoading ? 'Enviando...' : 'Enviar Verificação'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancelExchange}
            disabled={isLoading}
            className="text-sm"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailExchangeSection;