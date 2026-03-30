import { useState } from 'react';
import Modal from '../ui/Modal';
import HabitForm from './HabitForm';
import { useHabitStore } from '../../stores/habitStore';
import { useUIStore } from '../../stores/uiStore';
import type { Habit, HabitFormData } from '../../types';
import toast from 'react-hot-toast';

interface EditHabitModalProps {
  habit: Habit | null;
  onClose: () => void;
}

export default function EditHabitModal({ habit, onClose }: EditHabitModalProps) {
  const { updateHabit } = useHabitStore();
  const [loading, setLoading] = useState(false);

  if (!habit) return null;

  const handleSubmit = async (data: HabitFormData) => {
    setLoading(true);
    try {
      await updateHabit(habit.id, data);
      toast.success('Habit updated!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={!!habit}
      onClose={onClose}
      title="Edit Habit"
    >
      <HabitForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialData={habit}
        loading={loading}
        submitLabel="Update Habit"
      />
    </Modal>
  );
}
