import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { validateEmail, validatePassword, getPasswordStrength } from '../../utils/validators';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { email: string; password: string; fullName?: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function AuthForm({ mode, onSubmit, loading, error }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isRegister = mode === 'register';
  const passwordStrength = isRegister ? getPasswordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    const passErr = validatePassword(password);
    if (passErr) newErrors.password = passErr;

    if (isRegister && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit({ email, password, fullName: isRegister ? fullName : undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {isRegister && (
        <Input
          label="Full Name"
          placeholder="Enter your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          icon={<User size={16} />}
          autoComplete="name"
        />
      )}

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        icon={<Mail size={16} />}
        autoComplete="email"
      />

      <div className="space-y-1.5">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          icon={<Lock size={16} />}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
          {showPassword ? 'Hide' : 'Show'} password
        </button>

        {isRegister && password && passwordStrength && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: i < passwordStrength.score ? passwordStrength.color : '#E5E7EB',
                  }}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: passwordStrength.color }}>
              {passwordStrength.label}
            </p>
          </div>
        )}
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {isRegister ? 'Create Account' : 'Sign In'}
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <Link
          to={isRegister ? '/login' : '/register'}
          className="text-brand-500 hover:text-brand-600 font-medium transition-colors"
        >
          {isRegister ? 'Sign in' : 'Create one'}
        </Link>
      </p>
    </form>
  );
}
