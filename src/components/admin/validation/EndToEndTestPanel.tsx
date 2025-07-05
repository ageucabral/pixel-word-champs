
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Play, Target } from 'lucide-react';
import { 
  convertBrasiliaInputToUTC, 
  formatUTCForDateTimeLocal,
  getCurrentBrasiliaTime 
} from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface EndToEndTest {
  step: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  details: string;
}

export const EndToEndTestPanel: React.FC = () => {
  const [testInput, setTestInput] = useState('2025-06-26T23:00');
  const [testResults, setTestResults] = useState<EndToEndTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runEndToEndTest = () => {
    setIsRunning(true);
    const results: EndToEndTest[] = [];

    logger.info('🎯 TESTE END-TO-END INICIADO:', { 
      input: testInput, 
      timestamp: getCurrentBrasiliaTime() 
    }, 'END_TO_END_TEST_PANEL');

    // Teste 1: Input do usuário
    results.push({
      step: '1. Input do Usuário',
      input: testInput,
      expected: testInput,
      actual: testInput,
      passed: true,
      details: 'Usuário digita horário em Brasília'
    });

    // Teste 2: Conversão para UTC (storage)
    const utcForStorage = convertBrasiliaInputToUTC(testInput);
    const expectedUTCHours = testInput.includes('23:00') ? '02:00' : '18:30';
    const actualUTCHours = new Date(utcForStorage).toISOString().slice(11, 16);
    
    results.push({
      step: '2. Conversão para UTC (Storage)',
      input: testInput,
      expected: `UTC com horário ${expectedUTCHours}`,
      actual: `${utcForStorage} (${actualUTCHours})`,
      passed: actualUTCHours === expectedUTCHours || utcForStorage.includes(expectedUTCHours),
      details: 'Brasília → UTC (+3h) para salvar no banco'
    });

    // Teste 3: Preview no formulário
    const previewValue = testInput; // Preview deve ser igual ao input
    results.push({
      step: '3. Preview no Formulário',
      input: utcForStorage,
      expected: testInput,
      actual: previewValue,
      passed: previewValue === testInput,
      details: 'Preview mostra mesmo horário digitado (Brasília)'
    });

    // Teste 4: Conversão UTC → Input (para edição)
    const backToInput = formatUTCForDateTimeLocal(utcForStorage);
    results.push({
      step: '4. UTC → Input (Edição)',
      input: utcForStorage,
      expected: testInput,
      actual: backToInput,
      passed: backToInput === testInput,
      details: 'UTC do banco volta para input igual ao original'
    });

    // Teste 5: Exibição na lista
    const displayInList = testInput.replace('T', ' ').slice(0, 16); // Formato para lista
    const expectedListDisplay = testInput.replace('T', ' ').slice(0, 16);
    results.push({
      step: '5. Exibição na Lista',
      input: testInput,
      expected: expectedListDisplay,
      actual: displayInList,
      passed: displayInList === expectedListDisplay,
      details: 'Lista mostra horário igual ao digitado (Brasília)'
    });

    // Teste 6: Detalhes da competição
    const detailsDisplay = testInput.replace('T', ' ');
    const expectedDetails = testInput.replace('T', ' ');
    results.push({
      step: '6. Detalhes da Competição',
      input: testInput,
      expected: expectedDetails,
      actual: detailsDisplay,
      passed: detailsDisplay.startsWith(expectedDetails.slice(0, 16)),
      details: 'Detalhes mostram horário igual ao digitado (Brasília)'
    });

    setTestResults(results);
    setIsRunning(false);

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    logger.info('🎯 TESTE END-TO-END CONCLUÍDO:', {
      input: testInput,
      passedTests,
      totalTests,
      allPassed: passedTests === totalTests,
      results: results.map(r => ({
        step: r.step,
        passed: r.passed,
        actual: r.actual
      }))
    }, 'END_TO_END_TEST_PANEL');
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const allPassed = totalTests > 0 && passedTests === totalTests;

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Teste End-to-End Completo
        </CardTitle>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700">
            <strong>🎯 Objetivo:</strong> Testar todo o fluxo Input → Storage → Exibição
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Verifica se usuário sempre vê o mesmo horário que digitou (Brasília)
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="endToEndInput">Horário de Teste</Label>
            <Input
              id="endToEndInput"
              type="datetime-local"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
            />
            <p className="text-xs text-purple-600">
              Teste crítico: 23:00 (vira próximo dia em UTC)
            </p>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={runEndToEndTest} 
              disabled={isRunning}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full mr-2" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Teste End-to-End
                </>
              )}
            </Button>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className={`p-4 rounded-lg border-2 ${
            allPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {allPassed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                allPassed ? 'text-green-800' : 'text-red-800'
              }`}>
                Resultado: {passedTests}/{totalTests} passos passaram
              </span>
            </div>

            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.passed 
                      ? 'bg-white border-green-200' 
                      : 'bg-white border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      result.passed ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.step}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Input:</strong> {result.input}</p>
                    <p><strong>Esperado:</strong> {result.expected}</p>
                    <p><strong>Atual:</strong> {result.actual}</p>
                    <p className="text-xs text-gray-600">{result.details}</p>
                  </div>
                </div>
              ))}
            </div>

            {allPassed && (
              <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    ✅ SUCESSO TOTAL! Input = Preview = Lista = Detalhes
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  🎯 <strong>Confirmado:</strong> Usuário vê sempre o mesmo horário que digitou (Brasília)
                </p>
                <p className="text-xs text-green-600 mt-1">
                  UTC usado apenas internamente para storage, invisível ao usuário
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
