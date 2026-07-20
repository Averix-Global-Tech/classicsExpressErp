import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import { Card, CardHeader, CardBody, Input, Button, Alert } from '../components/ui';
import { ROLE_LABELS } from '../utils/constants';
import { initials } from '../utils/format';

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  password: yup
    .string()
    .min(8, 'Password must be 8–64 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/, {
      message: 'Must include upper, lower, number, and symbol.',
    })
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [serverError, setServerError] = useState('');
  const [serverMsg, setServerMsg] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const onSubmit = async (values) => {
    setServerError('');
    setServerMsg('');
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        password: values.password,
      });
      setServerMsg('Password changed successfully. Redirecting to sign in...');
      reset();
      toast.success('Password changed. Please sign in again.');
      setTimeout(() => logout(), 1500);
    } catch (err) {
      setServerError(err?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="text-orange-600" size={24} />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">My Profile</h1>
      </div>

      <Card>
        <CardHeader title="Account Info" />
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-xl font-bold text-orange-700">
              {initials(user?.name)}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <p className="text-xs text-slate-400">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Change Password" subtitle="Update your account password" />
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            {serverMsg && <Alert variant="success">{serverMsg}</Alert>}
            {serverError && <Alert variant="error">{serverError}</Alert>}

            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />

            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" loading={isSubmitting}>
              Update password
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
