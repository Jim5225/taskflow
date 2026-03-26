import { useState } from 'react';
import Modal from '../ui/Modal';
import TaskForm from './TaskForm';
import { useTaskStore } from '../../stores/taskStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import toast from 'react-hot-toast';

export default function AddTaskModal() {
  const { activeModal, closeModal } = useUIStore();
  const { addTask } = useTaskStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: { title: string; description: string; priority: string; due_date: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      await addTask(user.id, data as any);
      toast.success('Task created successfully!');
      closeModal();
    } catch {
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={activeModal === 'addTask'} onClose={closeModal} title="Create New Task">
      <TaskForm
        onSubmit={handleSubmit}
        onCancel={closeModal}
        loading={loading}
        submitLabel="Create Task"
      />
    </Modal>
  );
}
