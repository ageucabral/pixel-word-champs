
import { supabase } from '@/integrations/supabase/client';

// Função para chamar a OpenAI API
const callOpenAIAPI = async (categoryName: string, count: number, apiKey: string, config: any): Promise<string[]> => {
  console.log('🤖 Chamando OpenAI API com configurações:', {
    categoryName,
    count,
    hasKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature
  });

  const prompt = `Gere ${count} palavras em português relacionadas à categoria "${categoryName}". 
  
Retorne apenas as palavras, uma por linha, em MAIÚSCULAS, sem numeração ou pontuação.
As palavras devem ser variadas em tamanho (3-8 letras) para diferentes níveis de dificuldade.

Exemplo:
GATO
CACHORRO
PEIXE
CAVALO
COELHO`;

  const requestBody = {
    model: config.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: config.systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: config.maxTokens || 300,
    temperature: config.temperature || 0.7,
  };

  console.log('📤 Enviando requisição para OpenAI:', {
    model: requestBody.model,
    systemPromptLength: config.systemPrompt?.length || 0,
    maxTokens: requestBody.max_tokens,
    temperature: requestBody.temperature
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('📥 Resposta da OpenAI:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Erro da OpenAI API:', errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  console.log('📊 Dados recebidos da OpenAI:', {
    choices: data.choices?.length || 0,
    hasContent: !!data.choices?.[0]?.message?.content
  });
  
  const content = data.choices[0].message.content;
  
  // Processar a resposta para extrair as palavras
  const words = content
    .split('\n')
    .map((word: string) => word.trim().toUpperCase())
    .filter((word: string) => word && word.length >= 3 && /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+$/.test(word))
    .slice(0, count); // Garantir a quantidade solicitada

  console.log('✅ Palavras processadas:', {
    totalEncontradas: words.length,
    palavras: words.slice(0, 5) // Mostrar apenas as primeiras 5 para log
  });

  return words;
};

// Função principal para gerar palavras
export const generateWordsForCategory = async (categoryName: string, count: number): Promise<string[]> => {
  try {
    console.log('🚀 Iniciando geração de palavras para categoria:', categoryName, 'quantidade:', count);
    
    // Buscar a API key e configurações da OpenAI
    const { data: openaiSettings, error } = await supabase
      .from('game_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'openai_api_key', 
        'openai_system_prompt', 
        'openai_model', 
        'openai_max_tokens', 
        'openai_temperature'
      ])
      .eq('category', 'integrations');

    if (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      throw new Error('Configurações da OpenAI não encontradas');
    }

    console.log('📋 Configurações encontradas:', openaiSettings?.length || 0);

    const apiKeySetting = openaiSettings?.find(s => s.setting_key === 'openai_api_key');
    const systemPromptSetting = openaiSettings?.find(s => s.setting_key === 'openai_system_prompt');
    const modelSetting = openaiSettings?.find(s => s.setting_key === 'openai_model');
    const maxTokensSetting = openaiSettings?.find(s => s.setting_key === 'openai_max_tokens');
    const temperatureSetting = openaiSettings?.find(s => s.setting_key === 'openai_temperature');

    if (!apiKeySetting?.setting_value || apiKeySetting.setting_value.trim().length === 0) {
      console.error('❌ API key da OpenAI não encontrada ou vazia');
      throw new Error('API key da OpenAI não configurada. Configure na aba Integrações.');
    }

    const config = {
      model: modelSetting?.setting_value || 'gpt-4o-mini',
      maxTokens: maxTokensSetting?.setting_value ? parseInt(maxTokensSetting.setting_value) : 300,
      temperature: temperatureSetting?.setting_value ? parseFloat(temperatureSetting.setting_value) : 0.7,
      systemPrompt: systemPromptSetting?.setting_value || 'Você é um assistente especializado em gerar palavras para jogos de caça-palavras em português.'
    };

    const apiKey = apiKeySetting.setting_value.trim();
    
    console.log('🔧 Configurações carregadas:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey.length,
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      systemPromptLength: config.systemPrompt.length
    });
    
    return await callOpenAIAPI(categoryName, count, apiKey, config);
    
  } catch (error) {
    console.error('❌ Erro ao gerar palavras com OpenAI:', error);
    throw error;
  }
};
