import { useState } from 'react';
import Modal from '../ui/Modal';
import TaskForm from './TaskForm';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import toast from 'react-hot-toast';
import type { TaskFormData } from '../../types';

export default function EditTaskModal() {
  const { activeModal, closeModal } = useUIStore();
  const { editingTask, updateTask, setEditingTask } = useTaskStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: TaskFormData) => {
    if (!editingTask) return;
    setLoading(true);
    try {
      await updateTask(editingTask.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        quadrant: data.quadrant,
        due_date: data.due_date || null,
      });
      toast.success('Task updated!');
      handleClose();
    } catch {
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEditingTask(null);
    closeModal();
  };

  return (
    <Modal isOpen={activeModal === 'editTask'} onClose={handleClose} title="Edit Task">
      {editingTask && (
        <TaskForm
          initialData={{
            title: editingTask.title,
            description: editingTask.description,
            priority: editingTask.priority,
            quadrant: editingTask.quadrant,
            due_date: editingTask.due_date
              ? new Date(editingTask.due_date).toISOString().slice(0, 16)
              : '',
          }}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={loading}
          submitLabel="Save Changes"
        />
      )}
    </Modal>
  );
}
