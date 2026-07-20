import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import authService from '../services/authService';
import { Input, Button, Alert } from '../components/ui';

const schema = yup.object({
  password: yup
    .string()
    .min(8, 'Password must be 8–64 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/, {
      message: 'Must include upper, lower, number, and symbol.',
    })
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [serverMsg, setServerMsg] = useState('');
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values) => {
    setServerMsg('');
    setServerError('');
    try {
      const result = await authService.resetPassword({ token, password: values.password });
      setServerMsg(result?.message || 'Password reset successful.');
    } catch (err) {
      setServerError(err?.message || 'Reset failed. The link may have expired.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!token && <Alert variant="warning">No reset token found. Please use the link from your email.</Alert>}
      {serverMsg && <Alert variant="success">{serverMsg}</Alert>}
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <Input
        label="New password"
        type="password"
        placeholder="Enter new password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Confirm password"
        type="password"
        placeholder="Re-enter new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" loading={isSubmitting} disabled={!token} className="w-full">
        Reset password
      </Button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-medium text-orange-600 hover:text-orange-700">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
