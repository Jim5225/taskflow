import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useCategoryStore } from '../../stores/categoryStore';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', 
  '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#0EA5E9'
];

export default function CategoryModal() {
  const { user } = useAuthStore();
  const { activeModal, closeModal } = useUIStore();
  const { addCategory, updateCategory, selectedCategoryForEdit, isLoading } = useCategoryStore();

  const [formData, setFormData] = useState({
    name: '',
    target_sessions: 1,
    color: COLORS[0],
  });

  const isEditing = activeModal === 'editCategory';
  const isOpen = activeModal === 'addCategory' || isEditing;

  useEffect(() => {
    if (isEditing && selectedCategoryForEdit) {
      setFormData({
        name: selectedCategoryForEdit.name,
        target_sessions: selectedCategoryForEdit.target_sessions || 1,
        color: selectedCategoryForEdit.color || COLORS[0],
      });
    } else {
      setFormData({
        name: '',
        target_sessions: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
  }, [isEditing, selectedCategoryForEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (isEditing && selectedCategoryForEdit) {
      await updateCategory(selectedCategoryForEdit.id, formData);
    } else {
      await addCategory(user.id, formData);
    }
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={isEditing ? 'Edit Category' : 'New Category'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Category Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Reading, BCS Preparation..."
          required
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Sessions (Pomodoros)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="20"
              value={formData.target_sessions}
              onChange={(e) => setFormData({ ...formData, target_sessions: parseInt(e.target.value) })}
              className="flex-1 accent-brand-500"
            />
            <span className="text-xl font-bold w-8 text-center text-gray-900 dark:text-white">
              {formData.target_sessions}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Target number of 25-minute Pomodoro sessions.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData({ ...formData, color: c })}
                className={`w-8 h-8 rounded-full transition-transform ${
                  formData.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={closeModal}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            loading={isLoading}
          >
            {isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
