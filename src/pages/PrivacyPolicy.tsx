
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
          <h1 className="text-2xl font-bold text-white">Política de Privacidade</h1>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Política de Privacidade - Letra Arena</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Política de Privacidade – Caça Palavras Royale</h2>
              <p className="text-sm text-gray-600">Data de Vigência: 07 de julho de 2025</p>
            </div>

            <p className="text-gray-700 mb-6">
              Esta Política de Privacidade descreve como o aplicativo "Caça Palavras Royale" coleta, usa e protege as informações dos usuários, incluindo crianças menores de 13 anos, em conformidade com a Política do Programa para Famílias da Google Play e com a Lei de Proteção da Privacidade Online das Crianças (COPPA).
            </p>

            <section>
              <h3 className="text-lg font-semibold mb-3">1. Coleta de Dados</h3>
              <p className="text-gray-700 mb-3">
                O aplicativo não coleta dados pessoais sensíveis dos usuários, como nome, e-mail, localização precisa ou contatos.
              </p>
              <p className="text-gray-700 mb-2">Podemos coletar os seguintes dados não pessoais, automaticamente:</p>
              <ul className="text-gray-700 ml-4 space-y-1">
                <li>• Identificadores anônimos (ID de dispositivo, cookies para anúncios);</li>
                <li>• Estatísticas de uso (tempo de uso, interações com o jogo);</li>
                <li>• Dados de desempenho e erros (falhas e logs técnicos).</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">2. Publicidade e Monetização</h3>
              <p className="text-gray-700 mb-3">
                O jogo pode exibir anúncios de terceiros, como o Google AdMob, que podem utilizar identificadores anônimos para exibir anúncios.
              </p>
              <p className="text-gray-700">
                ⚠️ Para usuários com menos de 13 anos, os anúncios são exibidos de forma não personalizada (sem rastreamento de comportamento).
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">3. Crianças</h3>
              <p className="text-gray-700 mb-3">
                Caça Palavras Royale é destinado a públicos de todas as idades, incluindo crianças. Para proteger os menores de 13 anos, seguimos as seguintes práticas:
              </p>
              <ul className="text-gray-700 ml-4 space-y-1">
                <li>• Não coletamos dados pessoais de crianças;</li>
                <li>• Exibimos apenas anúncios apropriados para crianças, quando necessário;</li>
                <li>• Garantimos uma experiência segura, educativa e divertida.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">4. Compartilhamento de Dados</h3>
              <p className="text-gray-700 mb-2">Não compartilhamos informações dos usuários com terceiros, exceto:</p>
              <ul className="text-gray-700 ml-4 space-y-1">
                <li>• Provedores de serviços estritamente necessários para o funcionamento (ex: Google AdMob);</li>
                <li>• Quando exigido por lei ou por autoridades legais competentes.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">5. Segurança</h3>
              <p className="text-gray-700">
                Adotamos medidas técnicas e organizacionais para proteger todos os dados coletados contra acesso não autorizado, vazamentos ou exclusões indevidas.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">6. Seus Direitos</h3>
              <p className="text-gray-700">
                Se você é pai, mãe ou responsável e acredita que coletamos dados pessoais de uma criança sem consentimento adequado, entre em contato conosco para que possamos excluir essas informações.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">7. Alterações nesta Política</h3>
              <p className="text-gray-700">
                Esta Política pode ser atualizada ocasionalmente. A versão mais recente estará sempre disponível em uma página acessível do aplicativo ou na loja.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">8. Contato</h3>
              <p className="text-gray-700 mb-2">Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco:</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Responsável:</strong> Equipe Caça Palavras Royale<br/>
                  <strong>E-mail de contato:</strong> app.ageu@gmail.com
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
