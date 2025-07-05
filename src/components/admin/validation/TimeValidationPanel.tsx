
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { 
  convertBrasiliaInputToUTC, 
  formatBrasiliaDate, 
  getCurrentBrasiliaTime,
  formatUTCForDateTimeLocal,
  calculateEndDateWithDuration,
  validateCompetitionDuration 
} from '@/utils/brasiliaTimeUnified';
import { logger } from '@/utils/logger';

interface ValidationResult {
  test: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  details: string;
}

export const TimeValidationPanel: React.FC = () => {
  const [testInput, setTestInput] = useState('2025-06-26T15:30');
  const [testDuration, setTestDuration] = useState(3);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runComprehensiveTests = () => {
    setIsRunning(true);
    const results: ValidationResult[] = [];

    // Teste 1: Conversão Brasília → UTC
    logger.info('🧪 TESTE 1: Conversão Brasília → UTC', {}, 'TIME_VALIDATION_PANEL');
    const brasiliaInput = '2025-06-26T15:30';
    const expectedUTC = '2025-06-26T18:30:00.000Z'; // +3h
    const actualUTC = convertBrasiliaInputToUTC(brasiliaInput);
    
    results.push({
      test: 'Conversão Brasília → UTC',
      input: `${brasiliaInput} (Brasília)`,
      expected: expectedUTC,
      actual: actualUTC,
      passed: actualUTC === expectedUTC,
      details: `Input: ${brasiliaInput} → UTC: ${actualUTC} (deve adicionar +3h)`
    });

    // Teste 2: Conversão UTC → Brasília para exibição
    logger.info('🧪 TESTE 2: Conversão UTC → Brasília para exibição', {}, 'TIME_VALIDATION_PANEL');
    const utcForDisplay = '2025-06-26T18:30:00.000Z';
    const expectedBrasilia = '26/06/2025 15:30:00'; // -3h SEM VÍRGULA
    const actualBrasilia = formatBrasiliaDate(utcForDisplay, true);
    
    results.push({
      test: 'Conversão UTC → Brasília (exibição)',
      input: `${utcForDisplay} (UTC)`,
      expected: expectedBrasilia,
      actual: actualBrasilia,
      passed: actualBrasilia === expectedBrasilia,
      details: `UTC: ${utcForDisplay} → Brasília: ${actualBrasilia} (deve subtrair -3h)`
    });

    // Teste 3: Roundtrip (Brasília → UTC → Brasília)
    logger.info('🧪 TESTE 3: Roundtrip (Brasília → UTC → Brasília)', {}, 'TIME_VALIDATION_PANEL');
    const originalBrasilia = '2025-06-26T15:30';
    const convertedToUTC = convertBrasiliaInputToUTC(originalBrasilia);
    const backToBrasilia = formatUTCForDateTimeLocal(convertedToUTC);
    
    results.push({
      test: 'Roundtrip (Brasília → UTC → Brasília)',
      input: `${originalBrasilia} (original)`,
      expected: originalBrasilia,
      actual: backToBrasilia,
      passed: originalBrasilia === backToBrasilia,
      details: `Original: ${originalBrasilia} → UTC: ${convertedToUTC} → Volta: ${backToBrasilia}`
    });

    // Teste 4: Cálculo de duração em Brasília
    logger.info('🧪 TESTE 4: Cálculo de duração em Brasília', {}, 'TIME_VALIDATION_PANEL');
    const startBrasilia = '2025-06-26T15:30';
    const duration = 3;
    const expectedEndBrasilia = '2025-06-26T18:30';
    const calculatedEndUTC = calculateEndDateWithDuration(startBrasilia, duration);
    const calculatedEndBrasilia = formatUTCForDateTimeLocal(calculatedEndUTC);
    
    results.push({
      test: 'Cálculo de duração (Brasília)',
      input: `${startBrasilia} + ${duration}h`,
      expected: expectedEndBrasilia,
      actual: calculatedEndBrasilia,
      passed: calculatedEndBrasilia === expectedEndBrasilia,
      details: `Início: ${startBrasilia} + ${duration}h → Fim: ${calculatedEndBrasilia}`
    });

    // Teste 5: Validação de limite (23:59:59)
    logger.info('🧪 TESTE 5: Validação de limite (23:59:59)', {}, 'TIME_VALIDATION_PANEL');
    const lateStart = '2025-06-26T22:00';
    const longDuration = 4;
    const validation = validateCompetitionDuration(lateStart, longDuration);
    
    results.push({
      test: 'Validação de limite do dia',
      input: `${lateStart} + ${longDuration}h`,
      expected: 'Deve falhar (ultrapassaria 23:59:59)',
      actual: validation.isValid ? 'Passou' : `Falhou: ${validation.error}`,
      passed: !validation.isValid,
      details: `22:00 + 4h = 02:00 (próximo dia) → deve ser rejeitado`
    });

    // Teste 6: CORRIGIDO - Horário atual Brasília (formato padronizado)
    logger.info('🧪 TESTE 6: Horário atual Brasília (formato padronizado)', {}, 'TIME_VALIDATION_PANEL');
    const currentBrasilia = getCurrentBrasiliaTime();
    const brazilianFormat = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(currentBrasilia); // SEM VÍRGULA
    
    results.push({
      test: 'Horário atual Brasília (formato padronizado)',
      input: 'getCurrentBrasiliaTime()',
      expected: 'Formato DD/MM/YYYY HH:mm:ss (sem vírgula)',
      actual: currentBrasilia,
      passed: brazilianFormat,
      details: `Formato brasileiro padronizado: ${currentBrasilia}`
    });

    // Teste 7: Teste personalizado com input do usuário
    if (testInput) {
      logger.info('🧪 TESTE 7: Teste personalizado', {}, 'TIME_VALIDATION_PANEL');
      const customUTC = convertBrasiliaInputToUTC(testInput);
      const customBack = formatUTCForDateTimeLocal(customUTC);
      
      results.push({
        test: 'Teste personalizado (roundtrip)',
        input: testInput,
        expected: testInput,
        actual: customBack,
        passed: testInput === customBack,
        details: `${testInput} → UTC: ${customUTC} → ${customBack}`
      });
    }

    setValidationResults(results);
    setIsRunning(false);

    // Log consolidado
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    logger.info(`✅ RESULTADO DOS TESTES: ${passedTests}/${totalTests} passaram`, {}, 'TIME_VALIDATION_PANEL');
    logger.info('📊 RESUMO:', {
      timestamp: getCurrentBrasiliaTime(),
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      allPassed: passedTests === totalTests
    }, 'TIME_VALIDATION_PANEL');
  };

  const passedTests = validationResults.filter(r => r.passed).length;
  const totalTests = validationResults.length;
  const allPassed = totalTests > 0 && passedTests === totalTests;

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Validação Completa do Sistema de Tempo Unificado (CORRIGIDO)
          </CardTitle>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>🎯 Objetivo:</strong> Validar que Input = Preview = Exibição (todos Brasília), UTC apenas para storage
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Horário atual: {getCurrentBrasiliaTime()}
            </p>
            <p className="text-xs text-green-600 mt-1">
              ✅ <strong>CORREÇÃO:</strong> Formato padronizado sem vírgula para consistência
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testInput">Teste Personalizado</Label>
              <Input
                id="testInput"
                type="datetime-local"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Digite um horário para testar conversões
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="testDuration">Duração (horas)</Label>
              <Input
                id="testDuration"
                type="number"
                min="1"
                max="12"
                value={testDuration}
                onChange={(e) => setTestDuration(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <Button 
            onClick={runComprehensiveTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <div className="animate-spin h-4 w-4 border border-current border-t-transparent rounded-full mr-2" />
                Executando testes...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Executar Validação Completa
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {validationResults.length > 0 && (
        <Card className={`border-2 ${allPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {allPassed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Resultados da Validação ({passedTests}/{totalTests})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {validationResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.passed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
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
                      {result.test}
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
                    ✅ Todos os testes passaram! Sistema unificado funcionando corretamente.
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  🎯 <strong>Confirmado:</strong> Input = Preview = Exibição (Brasília), UTC apenas para storage
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
