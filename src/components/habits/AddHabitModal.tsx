import { useState } from 'react';
import Modal from '../ui/Modal';
import HabitForm from './HabitForm';
import { useHabitStore } from '../../stores/habitStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import type { HabitFormData } from '../../types';
import toast from 'react-hot-toast';

export default function AddHabitModal() {
  const { activeModal, closeModal } = useUIStore();
  const { addHabit } = useHabitStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: HabitFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      await addHabit(user.id, data);
      toast.success('Habit created successfully!');
      closeModal();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'addHabit'}
      onClose={closeModal}
      title="Create New Habit"
    >
      <HabitForm
        onSubmit={handleSubmit}
        onCancel={closeModal}
        loading={loading}
        submitLabel="Create Habit"
      />
    </Modal>
  );
}
