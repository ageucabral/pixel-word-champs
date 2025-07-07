
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from 'lucide-react';

interface TermsOfServiceScreenProps {
  onBack: () => void;
}

const TermsOfServiceScreen = ({ onBack }: TermsOfServiceScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Termos de Uso</h1>
            <p className="text-sm text-gray-600">Nossos termos e condições</p>
          </div>
        </div>

        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Termos de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Última atualização: Janeiro 2025
            </p>

            <div className="space-y-4">
              <section>
                <h3 className="font-semibold text-gray-800 mb-2">1. Aceitação dos Termos</h3>
                <p className="text-sm text-gray-600">
                  Ao usar o Caça Palavras Royale, você concorda com estes termos de uso. 
                  Se não concordar, não utilize nossos serviços.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-800 mb-2">2. Uso do Serviço</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use o jogo de forma fair play</li>
                  <li>• Não use bots ou automação</li>
                  <li>• Não tente explorar vulnerabilidades</li>
                  <li>• Respeite outros jogadores</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-gray-800 mb-2">3. Conta de Usuário</h3>
                <p className="text-sm text-gray-600">
                  Você é responsável por manter a segurança de sua conta e por todas as 
                  atividades que ocorrem sob sua conta.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-800 mb-2">4. Propriedade Intelectual</h3>
                <p className="text-sm text-gray-600">
                  Todo o conteúdo do Caça Palavras Royale, incluindo design, texto, gráficos e software, 
                  é propriedade nossa ou de nossos licenciadores.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-800 mb-2">5. Limitação de Responsabilidade</h3>
                <p className="text-sm text-gray-600">
                  O serviço é fornecido "como está". Não garantimos que o serviço será 
                  ininterrupto ou livre de erros.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-800 mb-2">6. Modificações</h3>
                <p className="text-sm text-gray-600">
                  Podemos modificar estes termos a qualquer momento. Continuando a usar o serviço 
                  após as alterações, você aceita os novos termos.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-800 mb-2">7. Rescisão</h3>
                <p className="text-sm text-gray-600">
                  Podemos suspender ou encerrar sua conta a qualquer momento por violação 
                  destes termos.
                </p>
              </section>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                📧 Dúvidas sobre os termos? Entre em contato: legal@letraarena.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfServiceScreen;
