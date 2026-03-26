import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import AuthForm from '../components/auth/AuthForm';
import { useEffect } from 'react';
import { CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, loading, error, user, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard', { replace: true });
    } catch {
      // Error is handled in the store
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CheckSquare className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">TickFlow</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Your productivity,<br />supercharged.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            Manage tasks, track focus sessions, and level up your productivity with beautiful analytics and gamification.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['Task Management', 'Pomodoro Timer', 'Gamification', 'Statistics'].map((f) => (
              <span key={f} className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-sm">
                {f}
              </span>
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
            Welcome back
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Sign in to continue your productivity journey.
          </p>

          <AuthForm mode="login" onSubmit={handleSubmit} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}
