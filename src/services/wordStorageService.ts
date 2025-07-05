
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const saveWordsToDatabase = async (
  words: string[], 
  categoryId: string, 
  categoryName: string
) => {
  logger.info('📝 Iniciando salvamento de palavras:', {
    category: categoryName,
    wordsReceived: words.length,
    words: words
  }, 'WORD_STORAGE_SERVICE');

  if (!words || words.length === 0) {
    logger.info('ℹ️ Nenhuma palavra para salvar', {}, 'WORD_STORAGE_SERVICE');
    return { words: [], count: 0 };
  }

  // Normalizar palavras (maiúsculas e sem espaços)
  const normalizedWords = words
    .map(word => word.trim().toUpperCase())
    .filter(word => word.length >= 3 && /^[A-Z]+$/.test(word));

  logger.info('📊 Palavras após normalização:', {
    category: categoryName,
    original: words.length,
    normalized: normalizedWords.length,
    normalizedWords
  }, 'WORD_STORAGE_SERVICE');

  if (normalizedWords.length === 0) {
    logger.warn('⚠️ Nenhuma palavra válida após normalização', {}, 'WORD_STORAGE_SERVICE');
    return { words: [], count: 0 };
  }

  // VERIFICAÇÃO MELHORADA: Buscar palavras existentes APENAS nesta categoria
  logger.info(`🔍 Verificando palavras existentes na categoria "${categoryName}"...`, {}, 'WORD_STORAGE_SERVICE');
  
  const { data: existingWords, error: checkError } = await supabase
    .from('level_words')
    .select('word, id, created_at')
    .in('word', normalizedWords)
    .eq('category', categoryName)
    .eq('is_active', true);

  if (checkError) {
    logger.error('❌ Erro ao verificar palavras existentes:', { checkError }, 'WORD_STORAGE_SERVICE');
    throw checkError;
  }

  logger.info(`📋 Palavras já existentes na categoria "${categoryName}":`, {
    count: existingWords?.length || 0,
    words: existingWords?.map(w => w.word) || []
  }, 'WORD_STORAGE_SERVICE');

  // Criar um Set das palavras que já existem NESTA CATEGORIA
  const existingWordsSet = new Set(
    existingWords?.map(item => item.word) || []
  );

  // Filtrar apenas palavras que realmente não existem NESTA CATEGORIA
  const newWords = normalizedWords.filter(word => {
    const exists = existingWordsSet.has(word);
    if (exists) {
      logger.warn(`⚠️ Palavra "${word}" já existe na categoria "${categoryName}" - pulando`, { word, categoryName }, 'WORD_STORAGE_SERVICE');
    }
    return !exists;
  });

  // Remover duplicatas dentro do próprio array de palavras novas
  const uniqueNewWords = [...new Set(newWords)];

  logger.info(`📊 Análise final para categoria "${categoryName}":`, {
    palavrasOriginais: words.length,
    palavrasNormalizadas: normalizedWords.length,
    palavrasJaExistentes: normalizedWords.length - newWords.length,
    palavrasNovasUnicas: uniqueNewWords.length,
    palavrasParaInserir: uniqueNewWords
  }, 'WORD_STORAGE_SERVICE');

  if (uniqueNewWords.length === 0) {
    logger.info(`ℹ️ Todas as palavras já existem na categoria "${categoryName}"`, { categoryName }, 'WORD_STORAGE_SERVICE');
    return { words: [], count: 0 };
  }

  // Preparar palavras para inserção - sem definir dificuldade automaticamente
  const wordsToInsert = uniqueNewWords.map(word => {
    const wordData = {
      word: word,
      category: categoryName,
      difficulty: 'medium', // Dificuldade padrão, será definida manualmente
      level: 1,
      is_active: true
    };
    
    logger.debug(`🎯 Preparando para inserir: "${word}" na categoria "${categoryName}" com dificuldade "${wordData.difficulty}"`, { word, categoryName, difficulty: wordData.difficulty }, 'WORD_STORAGE_SERVICE');
    return wordData;
  });

  logger.info('💾 Iniciando inserção no banco de dados...', {
    category: categoryName,
    totalToInsert: wordsToInsert.length
  }, 'WORD_STORAGE_SERVICE');

  // INSERÇÃO MELHORADA: Usar upsert com melhor tratamento de erros
  const insertedWords = [];
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  for (const [index, wordData] of wordsToInsert.entries()) {
    try {
      logger.debug(`💽 [${index + 1}/${wordsToInsert.length}] Inserindo: "${wordData.word}" na categoria "${categoryName}"`, { index, word: wordData.word, categoryName }, 'WORD_STORAGE_SERVICE');
      
      const { data, error } = await supabase
        .from('level_words')
        .insert([wordData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Erro de duplicata - pode ser constraint única que não conhecemos
          duplicateCount++;
          logger.warn(`⚠️ DUPLICATA detectada: "${wordData.word}" na categoria "${categoryName}" (erro ${error.code})`, { word: wordData.word, categoryName, errorCode: error.code }, 'WORD_STORAGE_SERVICE');
          logger.warn('🔍 Detalhes do erro de duplicata:', { error }, 'WORD_STORAGE_SERVICE');
        } else {
          errorCount++;
          logger.error(`❌ Erro inesperado ao inserir "${wordData.word}":`, { word: wordData.word, error }, 'WORD_STORAGE_SERVICE');
        }
      } else {
        insertedWords.push(data);
        successCount++;
        logger.info(`✅ [${successCount}] Palavra inserida com sucesso: "${wordData.word}" na categoria "${categoryName}"`, { successCount, word: wordData.word, categoryName }, 'WORD_STORAGE_SERVICE');
      }
    } catch (err) {
      errorCount++;
      logger.error(`❌ Erro inesperado ao inserir palavra "${wordData.word}":`, { word: wordData.word, err }, 'WORD_STORAGE_SERVICE');
    }
  }

  const finalResult = {
    category: categoryName,
    totalReceived: words.length,
    normalizedWords: normalizedWords.length,
    duplicatesSkipped: duplicateCount,
    errors: errorCount,
    successfulInserts: successCount,
    insertedWords: insertedWords,
    count: successCount
  };

  logger.info(`🎯 RESULTADO FINAL para categoria "${categoryName}":`, { finalResult }, 'WORD_STORAGE_SERVICE');

  return { words: insertedWords, count: successCount };
};
