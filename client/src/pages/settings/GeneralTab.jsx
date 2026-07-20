import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card, CardHeader, CardBody, Input, Button, Alert } from '../../components/ui';

const schema = yup.object({
  companyName: yup.string().required('Company name is required'),
  contactEmail: yup.string().email('Invalid email').required('Email is required'),
  contactPhone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  pincode: yup.string().required('Pincode is required'),
});

export default function GeneralTab() {
  const [serverMsg, setServerMsg] = useState('');
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      companyName: 'Classic Express International Courier',
      contactEmail: 'admin@classicexpress.com',
      contactPhone: '+919000000000',
      address: '123 Business Park',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    },
  });

  const onSubmit = async (_values) => {
    setServerError('');
    setServerMsg('');
    try {
      // await settingsService.updateGeneral(values);
      setServerMsg('General settings saved successfully.');
    } catch (err) {
      setServerError(err?.message || 'Failed to save settings.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverMsg && <Alert variant="success">{serverMsg}</Alert>}
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <Card>
        <CardHeader title="Company Information" subtitle="Basic details about your organization" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" error={errors.companyName?.message} {...register('companyName')} />
            <Input label="Contact Email" type="email" error={errors.contactEmail?.message} {...register('contactEmail')} />
            <Input label="Contact Phone" error={errors.contactPhone?.message} {...register('contactPhone')} />
            <Input label="Address" error={errors.address?.message} {...register('address')} />
            <Input label="City" error={errors.city?.message} {...register('city')} />
            <Input label="State" error={errors.state?.message} {...register('state')} />
            <Input label="Pincode" error={errors.pincode?.message} {...register('pincode')} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Business Hours" subtitle="Operating hours for customer-facing operations" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Opening Time" type="time" defaultValue="09:00" />
            <Input label="Closing Time" type="time" defaultValue="18:00" />
          </div>
          <p className="mt-2 text-xs text-slate-400">These settings are for display purposes. Actual access control is managed separately.</p>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
      </div>
    </form>
  );
}
