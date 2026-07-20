import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input, Button, Alert } from '../components/ui';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
  rememberMe: yup.boolean().default(false),
});

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expired = searchParams.get('expired') === '1';
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const result = await login(values);
      if (result?.mustChangePassword) {
        toast.warning('Please change your temporary password before continuing.');
        navigate('/change-password', { replace: true });
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err?.message || 'Login failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {expired && (
        <Alert variant="warning">Your session has expired. Please sign in again.</Alert>
      )}
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
        endIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
            aria-label={showPassword ? 'Hide Password' : 'Show Password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm text-slate-700 dark:text-slate-300 select-none">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-orange-600 shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-50 mr-2"
            {...register('rememberMe')}
          />
          Remember Me
        </label>
        <Link to="/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-700 focus:outline-none focus:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
