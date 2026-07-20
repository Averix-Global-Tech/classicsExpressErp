import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import authService from '../services/authService';
import { Input, Button, Alert } from '../components/ui';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
});

export default function ForgotPasswordPage() {
  const [serverMsg, setServerMsg] = useState('');
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (values) => {
    setServerMsg('');
    setServerError('');
    try {
      const result = await authService.forgotPassword(values.email);
      setServerMsg(result?.message || 'If that account exists, a reset link has been sent.');
    } catch (err) {
      setServerError(err?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverMsg && <Alert variant="success">{serverMsg}</Alert>}
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Button type="submit" loading={isSubmitting} className="w-full">
        Send reset link
      </Button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-medium text-orange-600 hover:text-orange-700">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
