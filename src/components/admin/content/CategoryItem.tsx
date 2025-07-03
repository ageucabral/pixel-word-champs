import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from 'lucide-react';
import { DeleteCategoryModal } from './DeleteCategoryModal';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CategoryItemProps {
  category: Category;
  isEditing: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onEdit: (category: Category) => void;
  onUpdate: (id: string, data: { name: string; description: string }) => void;
  onDelete: (id: string, password?: string) => void;
  onCancelEdit: () => void;
}

export const CategoryItem = ({ 
  category, 
  isEditing, 
  isUpdating, 
  isDeleting, 
  onEdit, 
  onUpdate, 
  onDelete, 
  onCancelEdit 
}: CategoryItemProps) => {
  const [editForm, setEditForm] = useState({ 
    name: category.name, 
    description: category.description || '' 
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleUpdate = () => {
    if (!editForm.name.trim()) return;
    onUpdate(category.id, {
      name: editForm.name.trim(),
      description: editForm.description.trim()
    });
  };

  const handleEdit = () => {
    setEditForm({ 
      name: category.name, 
      description: category.description || '' 
    });
    onEdit(category);
  };

  const handleDeleteConfirm = () => {
    onDelete(category.id, '');
    setShowDeleteModal(false);
  };

  return (
    <>
      <Card className="border-slate-200">
        <CardContent className="p-4">
          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da categoria"
                />
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Salvar
                </Button>
                <Button 
                  onClick={onCancelEdit}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {category.name}
                  </Badge>
                  {category.description && (
                    <span className="text-sm text-slate-600">{category.description}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteCategoryModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        categoryName={category.name}
        isDeleting={isDeleting}
      />
    </>
  );
};
