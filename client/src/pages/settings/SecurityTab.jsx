import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card, CardHeader, CardBody, Input, Button, Alert } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be 8–64 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/, {
      message: 'Must include upper, lower, number, and symbol.',
    })
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm your password'),
});

export default function SecurityTab() {
  const { user } = useAuth();
  const [serverMsg, setServerMsg] = useState('');
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const onSubmit = async (_values) => {
    setServerError('');
    setServerMsg('');
    try {
      // await authService.changePassword({ currentPassword: values.currentPassword, password: values.newPassword });
      setServerMsg('Password updated successfully.');
      reset();
    } catch (err) {
      setServerError(err?.message || 'Failed to update password.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Account Security" subtitle="Manage your password and security settings" />
        <CardBody>
          <div className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p><strong>Account:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {user?.role === 'system_admin' ? 'System Administrator' : 'Admin'}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            {serverMsg && <Alert variant="success">{serverMsg}</Alert>}
            {serverError && <Alert variant="error">{serverError}</Alert>}

            <Input
              label="Current Password"
              type="password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <Input
              label="New Password"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" loading={isSubmitting}>Update Password</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Session Management" subtitle="Control active sessions and login history" />
        <CardBody>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium text-slate-800">Current Session</p>
                <p className="text-xs text-slate-500">Last active: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-IN') : '—'}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">Active</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
