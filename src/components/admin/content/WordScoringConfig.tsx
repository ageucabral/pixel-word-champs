
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface WordScoringEntry {
  id: string;
  wordSize: number;
  points: number;
  setting_key: string;
  isRange?: boolean;
  rangeEnd?: number;
}

interface WordScoringConfigProps {
  settings: Array<{
    id: string;
    setting_key: string;
    setting_value: string;
    setting_type: string;
    description: string;
    category: string;
  }>;
  onUpdate: (key: string, value: string) => void;
  onSave: () => void;
  saving: boolean;
  onRefresh: () => void;
}

export const WordScoringConfig = ({ settings, onUpdate, onSave, saving, onRefresh }: WordScoringConfigProps) => {
  const [newWordSize, setNewWordSize] = useState<string>('');
  const [newWordSizeEnd, setNewWordSizeEnd] = useState<string>('');
  const [newPoints, setNewPoints] = useState<string>('');
  const [sizeType, setSizeType] = useState<'single' | 'range'>('single');
  const { toast } = useToast();

  // Extrair todas as configurações de pontuação (incluindo as por tamanho de palavra e outras)
  const allScoringSettings = settings.filter(setting => setting.category === 'scoring');
  
  // Separar configurações por tamanho de palavra das outras configurações de pontuação
  const wordSizeSettings = allScoringSettings.filter(setting => 
    setting.setting_key.startsWith('points_per_') && 
    (setting.setting_key.includes('_letter_word') || setting.setting_key === 'points_per_expert_word' || setting.setting_key.includes('_to_'))
  );
  
  const otherScoringSettings = allScoringSettings.filter(setting => 
    !(setting.setting_key.startsWith('points_per_') && 
      (setting.setting_key.includes('_letter_word') || setting.setting_key === 'points_per_expert_word' || setting.setting_key.includes('_to_')))
  );

  const scoringEntries: WordScoringEntry[] = wordSizeSettings
    .map(setting => {
      // Verificar se é uma faixa (contém "_to_")
      if (setting.setting_key.includes('_to_')) {
        const rangeMatch = setting.setting_key.match(/points_per_(\d+)_to_(\d+)_letter_word/);
        if (rangeMatch) {
          return {
            id: setting.id,
            wordSize: parseInt(rangeMatch[1]),
            rangeEnd: parseInt(rangeMatch[2]),
            points: parseInt(setting.setting_value),
            setting_key: setting.setting_key,
            isRange: true
          };
        }
      }
      
      // Configuração de tamanho único
      const match = setting.setting_key.match(/points_per_(\d+|expert)_/);
      const wordSize = match?.[1] === 'expert' ? 8 : parseInt(match?.[1] || '0');
      return {
        id: setting.id,
        wordSize,
        points: parseInt(setting.setting_value),
        setting_key: setting.setting_key,
        isRange: false
      };
    })
    .sort((a, b) => a.wordSize - b.wordSize);

  const handleAddNew = async () => {
    const startSize = parseInt(newWordSize);
    const endSize = sizeType === 'range' ? parseInt(newWordSizeEnd) : null;
    const points = parseInt(newPoints);

    if (!startSize || startSize < 1 || !points || points < 0) {
      toast({
        title: "Erro",
        description: "Tamanho da palavra deve ser maior que 0 e pontuação não pode ser negativa",
        variant: "destructive"
      });
      return;
    }

    if (sizeType === 'range') {
      if (!endSize || endSize <= startSize) {
        toast({
          title: "Erro",
          description: "O tamanho final deve ser maior que o inicial",
          variant: "destructive"
        });
        return;
      }
    }

    // Gerar a chave da configuração
    let setting_key: string;
    let description: string;
    
    if (sizeType === 'range' && endSize) {
      setting_key = `points_per_${startSize}_to_${endSize}_letter_word`;
      description = `Pontos por palavra de ${startSize} a ${endSize} letras`;
    } else {
      setting_key = `points_per_${startSize}_letter_word`;
      description = `Pontos por palavra de ${startSize} letras`;
    }

    // Verificar se já existe configuração similar
    const existingEntry = scoringEntries.find(entry => {
      if (sizeType === 'range' && endSize) {
        return entry.setting_key === setting_key;
      } else {
        return entry.wordSize === startSize && !entry.isRange;
      }
    });
    
    if (existingEntry) {
      toast({
        title: "Erro",
        description: `Já existe configuração para este tamanho de palavra`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Inserir nova configuração no banco
      const { error } = await supabase
        .from('game_settings')
        .insert({
          setting_key,
          setting_value: points.toString(),
          setting_type: 'number',
          description,
          category: 'scoring'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Nova configuração adicionada com sucesso"
      });

      setNewWordSize('');
      setNewWordSizeEnd('');
      setNewPoints('');
      setSizeType('single');
      
      // Atualizar configurações sem recarregar a página
      onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a nova configuração",
        variant: "destructive"
      });
    }
  };

  const handleRemove = async (entry: WordScoringEntry) => {
    try {
      const { error } = await supabase
        .from('game_settings')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração removida com sucesso"
      });

      // Atualizar configurações sem recarregar a página
      onRefresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a configuração",
        variant: "destructive"
      });
    }
  };

  const handlePointsChange = (entry: WordScoringEntry, newPoints: string) => {
    onUpdate(entry.setting_key, newPoints);
  };

  const handleOtherSettingChange = (setting: any, newValue: string) => {
    onUpdate(setting.setting_key, newValue);
  };

  const formatWordSizeDisplay = (entry: WordScoringEntry) => {
    if (entry.isRange && entry.rangeEnd) {
      return `${entry.wordSize} a ${entry.rangeEnd} letras`;
    }
    return entry.wordSize === 8 ? '8+ letras' : `${entry.wordSize} letras`;
  };

  return (
    <Card className="border-2 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-slate-800">
            Sistema de Pontuação
          </CardTitle>
          <Badge variant="outline" className="bg-white/50">
            {allScoringSettings.length} configurações
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configurações por tamanho de palavra */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700">Pontuação por Tamanho da Palavra</h4>
          {scoringEntries.map((entry) => (
            <div key={entry.id} className="bg-white/70 rounded-lg p-4 border border-white/50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-sm font-medium text-slate-600 min-w-[120px]">
                    {formatWordSizeDisplay(entry)}
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={settings.find(s => s.setting_key === entry.setting_key)?.setting_value || entry.points}
                      onChange={(e) => handlePointsChange(entry, e.target.value)}
                      className="bg-white border-slate-200 w-24"
                      min="0"
                    />
                  </div>
                  <div className="text-sm text-slate-500">pontos</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(entry)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Outras configurações de pontuação */}
        {otherScoringSettings.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700">Outras Configurações de Pontuação</h4>
            {otherScoringSettings.map((setting) => (
              <div key={setting.id} className="bg-white/70 rounded-lg p-4 border border-white/50">
                <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                  {setting.description}
                </Label>
                <Input
                  type={setting.setting_type === 'number' ? 'number' : 'text'}
                  value={setting.setting_value}
                  onChange={(e) => handleOtherSettingChange(setting, e.target.value)}
                  className="bg-white border-slate-200"
                  placeholder={`Valor para ${setting.setting_key}`}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Chave: {setting.setting_key}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Adicionar nova configuração por tamanho */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-700">Adicionar Nova Configuração por Tamanho</h4>
          <div className="bg-white/70 rounded-lg p-4 border border-white/50">
            <div className="space-y-4">
              {/* Tipo de configuração */}
              <div>
                <Label className="text-sm font-medium text-slate-600 mb-2 block">
                  Tipo de Configuração
                </Label>
                <Select value={sizeType} onValueChange={(value: 'single' | 'range') => setSizeType(value)}>
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Tamanho único (ex: 4 letras)</SelectItem>
                    <SelectItem value="range">Faixa de tamanhos (ex: 3 a 5 letras)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos de entrada */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="wordSize" className="text-sm font-medium text-slate-600">
                    {sizeType === 'range' ? 'Tamanho Inicial' : 'Tamanho da Palavra'}
                  </Label>
                  <Input
                    id="wordSize"
                    type="number"
                    value={newWordSize}
                    onChange={(e) => setNewWordSize(e.target.value)}
                    placeholder="Ex: 3"
                    className="bg-white border-slate-200"
                    min="1"
                  />
                </div>
                
                {sizeType === 'range' && (
                  <div className="flex-1">
                    <Label htmlFor="wordSizeEnd" className="text-sm font-medium text-slate-600">
                      Tamanho Final
                    </Label>
                    <Input
                      id="wordSizeEnd"
                      type="number"
                      value={newWordSizeEnd}
                      onChange={(e) => setNewWordSizeEnd(e.target.value)}
                      placeholder="Ex: 5"
                      className="bg-white border-slate-200"
                      min="1"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <Label htmlFor="points" className="text-sm font-medium text-slate-600">
                    Pontuação
                  </Label>
                  <Input
                    id="points"
                    type="number"
                    value={newPoints}
                    onChange={(e) => setNewPoints(e.target.value)}
                    placeholder="Ex: 40"
                    className="bg-white border-slate-200"
                    min="0"
                  />
                </div>
                
                <Button
                  onClick={handleAddNew}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!newWordSize || !newPoints || (sizeType === 'range' && !newWordSizeEnd)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Botão salvar */}
        <div className="flex justify-end pt-4 border-t border-white/50">
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
