
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useActiveWords } from '@/hooks/useActiveWords';
import { DeleteAllWordsModal } from './DeleteAllWordsModal';
import { WordsListHeader } from './WordsListHeader';
import { WordsListFilters } from './WordsListFilters';
import { WordsListTableContent } from './WordsListTableContent';
import { WordsListPagination } from './WordsListPagination';
import { WordsListEmpty } from './WordsListEmpty';

const ITEMS_PER_PAGE = 10;

export const WordsListTable = () => {
  const { words, isLoading, refetch, deleteAllWords, isDeletingAll } = useActiveWords();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Filtrar palavras baseado na busca e categoria
  const filteredWords = useMemo(() => {
    let filtered = words;

    if (searchTerm) {
      filtered = filtered.filter(word => 
        word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(word => word.category === selectedCategory);
    }

    return filtered.sort((a, b) => {
      const categoryCompare = (a.category || '').localeCompare(b.category || '');
      if (categoryCompare !== 0) return categoryCompare;

      const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3, 'expert': 4 };
      const aDiff = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 5;
      const bDiff = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 5;
      
      if (aDiff !== bDiff) return aDiff - bDiff;
      return a.word.localeCompare(b.word);
    });
  }, [words, searchTerm, selectedCategory]);

  // Obter categorias únicas com contagem de palavras
  const categoriesWithCount = useMemo(() => {
    const categoryCount = words.reduce((acc, word) => {
      const category = word.category || 'Sem categoria';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(categoryCount).sort().map(category => ({
      name: category,
      count: categoryCount[category]
    }));
  }, [words]);

  const categories = categoriesWithCount.map(cat => cat.name);

  // Calcular paginação
  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredWords.length);
  const paginatedWords = filteredWords.slice(startIndex, endIndex);

  // Reset página quando filtros mudam
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleDeleteAll = () => {
    deleteAllWords('');
    setShowDeleteAllModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-border border-t-primary"></div>
          <span className="text-sm">Carregando palavras...</span>
        </div>
      </div>
    );
  }

  const hasFilters = Boolean(searchTerm || selectedCategory !== 'all');

  return (
    <div className="space-y-6">
      <WordsListHeader
        filteredWordsLength={filteredWords.length}
        totalWordsLength={words.length}
        categoriesLength={categories.length}
        onRefresh={() => refetch()}
        onDeleteAll={() => setShowDeleteAllModal(true)}
        isDeletingAll={isDeletingAll}
        hasWords={words.length > 0}
      />

      <WordsListFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        categoriesWithCount={categoriesWithCount}
      />

      <Card>
        <CardContent className="p-0">
          {filteredWords.length === 0 ? (
            <WordsListEmpty hasFilters={hasFilters} />
          ) : (
            <>
              <WordsListTableContent words={paginatedWords} />
              <WordsListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={filteredWords.length}
              />
            </>
          )}
        </CardContent>
      </Card>

      <DeleteAllWordsModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={handleDeleteAll}
        isDeleting={isDeletingAll}
        totalWords={words.length}
      />
    </div>
  );
};
