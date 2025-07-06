import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, CheckCircle, Info, Download, Calendar } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { customCompetitionService } from '@/services/customCompetitionService';
import { logger } from '@/utils/logger';

interface CompetitionCSVData {
  titulo: string;
  descricao: string;
  data_inicio: string;
  hora_inicio: string;
  duracao_horas: number;
}

interface CSVCompetitionUploadProps {
  onCompetitionsCreated?: () => void;
}

export const CSVCompetitionUpload: React.FC<CSVCompetitionUploadProps> = ({ onCompetitionsCreated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<CompetitionCSVData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setShowPreview(false);
      setPreviewData([]);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV válido",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (text: string): CompetitionCSVData[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const competitions: CompetitionCSVData[] = [];
    
    // Pular cabeçalho se existir
    const startIndex = lines[0].toLowerCase().includes('titulo') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split('|').map(part => part.trim());
      
      if (parts.length >= 5) {
        const [titulo, descricao, data_inicio, hora_inicio, duracao_str] = parts;
        const duracao_horas = parseInt(duracao_str);
        
        if (titulo && data_inicio && hora_inicio && !isNaN(duracao_horas)) {
          competitions.push({
            titulo,
            descricao: descricao || '',
            data_inicio,
            hora_inicio,
            duracao_horas
          });
        }
      }
    }
    
    return competitions;
  };

  const validateCompetition = (comp: CompetitionCSVData): string[] => {
    const errors: string[] = [];
    
    if (!comp.titulo || comp.titulo.length < 3) {
      errors.push('Título deve ter pelo menos 3 caracteres');
    }
    
    // Validar formato de data (YYYY-MM-DD ou DD/MM/YYYY)
    const dateRegex = /^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/;
    if (!dateRegex.test(comp.data_inicio)) {
      errors.push('Data deve estar no formato YYYY-MM-DD ou DD/MM/YYYY');
    }
    
    // Validar formato de hora (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(comp.hora_inicio)) {
      errors.push('Hora deve estar no formato HH:MM');
    }
    
    if (comp.duracao_horas < 1 || comp.duracao_horas > 24) {
      errors.push('Duração deve ser entre 1 e 24 horas');
    }
    
    return errors;
  };

  const normalizeDate = (dateStr: string): string => {
    // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr; // Já está no formato YYYY-MM-DD
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhuma competição válida encontrada no arquivo",
          variant: "destructive",
        });
        return;
      }

      setPreviewData(parsed);
      setShowPreview(true);
      
      logger.info('CSV parsed for preview', { 
        totalCompetitions: parsed.length,
        firstCompetition: parsed[0]
      }, 'CSV_COMPETITION_UPLOAD');
      
    } catch (error) {
      logger.error('Error parsing CSV:', { error }, 'CSV_COMPETITION_UPLOAD');
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo CSV",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (previewData.length === 0) {
      toast({
        title: "Erro",
        description: "Visualize o arquivo antes de fazer o upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const competitions = previewData.map(comp => {
        const normalizedDate = normalizeDate(comp.data_inicio);
        const startDateTime = `${normalizedDate}T${comp.hora_inicio}:00`;
        
        // Calcular data de fim (mesmo dia)
        const startDate = new Date(startDateTime);
        const endDate = new Date(startDate.getTime() + (comp.duracao_horas * 60 * 60 * 1000));
        
        return {
          title: comp.titulo,
          description: comp.descricao,
          type: 'daily' as const,
          startDate: startDateTime,
          endDate: endDate.toISOString(),
          duration: comp.duracao_horas,
          maxParticipants: 0 // Competições diárias não têm limite
        };
      });

      logger.info('Creating bulk competitions', { 
        count: competitions.length,
        sample: competitions[0]
      }, 'CSV_COMPETITION_UPLOAD');

      const result = await customCompetitionService.createBulkCompetitions(competitions);

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `${result.data?.created || competitions.length} competições foram criadas com sucesso`,
        });

        // Limpar formulário
        setSelectedFile(null);
        setPreviewData([]);
        setShowPreview(false);
        const fileInput = document.getElementById('csv-competition-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Callback para atualizar lista
        onCompetitionsCreated?.();
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }

    } catch (error) {
      logger.error('Error uploading competitions:', { error }, 'CSV_COMPETITION_UPLOAD');
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar competições",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      'titulo|descricao|data_inicio|hora_inicio|duracao_horas',
      'Desafio Matinal|Competição de manhã|2024-12-10|08:00|4',
      'Arena Noturna|Competição da noite|2024-12-10|20:00|6',
      'Fim de Semana|Competição especial, ideal para famílias|11/12/2024|14:00|8'
    ].join('\n');

    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_competicoes_diarias.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Competições Diárias via CSV
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário à esquerda */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-competition-file">Arquivo CSV</Label>
              <Input
                id="csv-competition-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {selectedFile.name}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePreview}
                disabled={!selectedFile || isUploading}
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              
              <Button
                onClick={downloadTemplate}
                variant="outline"
                size="icon"
                title="Baixar Template"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {showPreview && (
              <Button
                onClick={handleUpload}
                disabled={previewData.length === 0 || isUploading}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {isUploading ? 'Criando...' : `Criar ${previewData.length} Competições`}
              </Button>
            )}
          </div>

          {/* Instruções à direita */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Formato do CSV
                </h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>Separador:</strong> Use pipe (|) para separar as colunas</p>
                  <p>• <strong>titulo:</strong> Nome da competição (mín. 3 caracteres)</p>
                  <p>• <strong>descricao:</strong> Descrição opcional</p>
                  <p>• <strong>data_inicio:</strong> YYYY-MM-DD ou DD/MM/YYYY</p>
                  <p>• <strong>hora_inicio:</strong> HH:MM (formato 24h)</p>
                  <p>• <strong>duracao_horas:</strong> Entre 1 e 24 horas</p>
                </div>
                
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-blue-800 mb-1">Exemplo:</h5>
                    <div className="bg-white border border-blue-200 rounded p-2 text-xs font-mono">
                      titulo|descricao|data_inicio|hora_inicio|duracao_horas<br/>
                      Desafio Matinal|Competição de manhã|2024-12-10|08:00|4<br/>
                      Arena Noturna|Competição da noite|11/12/2024|20:00|6
                    </div>
                  </div>

                <div className="mt-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <p><strong>Regras automáticas:</strong></p>
                    <p>• Data de fim = Data de início + Duração</p>
                    <p>• Sem limite de participantes</p>
                    <p>• Sem prêmios em dinheiro</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview das competições */}
        {showPreview && previewData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Preview das Competições ({previewData.length})</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Título</th>
                      <th className="p-2 text-left">Data/Hora</th>
                      <th className="p-2 text-left">Duração</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((comp, index) => {
                      const errors = validateCompetition(comp);
                      const isValid = errors.length === 0;
                      
                      return (
                        <tr key={index} className={`border-t ${isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{comp.titulo}</div>
                              {comp.descricao && (
                                <div className="text-gray-500 text-xs">{comp.descricao}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            {comp.data_inicio} {comp.hora_inicio}
                          </td>
                          <td className="p-2">
                            {comp.duracao_horas}h
                          </td>
                          <td className="p-2">
                            {isValid ? (
                              <span className="text-green-600 text-xs">✓ Válida</span>
                            ) : (
                              <div className="text-red-600 text-xs">
                                <div>✗ Erro:</div>
                                {errors.map((error, i) => (
                                  <div key={i}>• {error}</div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};