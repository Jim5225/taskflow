import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import AuthForm from '../components/auth/AuthForm';
import { useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, loading, error, user, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (data: { email: string; password: string; fullName?: string }) => {
    try {
      await register(data.email, data.password, data.fullName || '');
      toast.success('Account created! Welcome to TickFlow 🎉');
      navigate('/dashboard', { replace: true });
    } catch {
      // Error is handled in the store
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent-600 via-brand-500 to-brand-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-32 right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-16 left-16 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CheckSquare className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">TickFlow</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Start your<br />productivity journey.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            Join thousands of productive people managing tasks, crushing goals, and leveling up every day.
          </p>

          {/* Stats showcase */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { value: '10K+', label: 'Tasks Completed' },
              { value: '8', label: 'Achievement Levels' },
              { value: '∞', label: 'Productivity' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-white/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-surface-dark-deep">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
              TickFlow
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Create your account
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            It's free! Start managing your tasks today.
          </p>

          <AuthForm mode="register" onSubmit={handleSubmit} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}
