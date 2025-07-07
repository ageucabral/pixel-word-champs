
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-3 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Termos de Uso</h1>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Termos de Uso - Caça Palavras Royale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">1. Aceitação dos Termos</h3>
              <p className="text-gray-700">
                Ao usar o Caça Palavras Royale, você concorda com estes termos de uso. Se não concordar, 
                não utilize nossos serviços.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Descrição do Serviço</h3>
              <p className="text-gray-700">
                O Caça Palavras Royale é um jogo de palavras onde os usuários participam de desafios 
                diários e competições com premiações reais.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Elegibilidade e Registro</h3>
              <p className="text-gray-700">
                Para participar, você deve ter pelo menos 18 anos e fornecer informações 
                verdadeiras durante o registro.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Regras do Jogo</h3>
              <p className="text-gray-700">
                Os usuários devem jogar de forma justa, sem usar ferramentas automatizadas 
                ou trapacear. Violações podem resultar em banimento.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Premiações</h3>
              <p className="text-gray-700">
                As premiações são distribuídas semanalmente via PIX para os vencedores. 
                É necessário fornecer dados bancários válidos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Propriedade Intelectual</h3>
              <p className="text-gray-700">
                Todo o conteúdo do Caça Palavras Royale é protegido por direitos autorais e 
                não pode ser reproduzido sem autorização.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Modificações</h3>
              <p className="text-gray-700">
                Reservamos o direito de modificar estes termos a qualquer momento. 
                Usuários serão notificados sobre mudanças importantes.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Contato</h3>
              <p className="text-gray-700">
                Para dúvidas sobre estes termos, entre em contato através do suporte 
                dentro do aplicativo.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
