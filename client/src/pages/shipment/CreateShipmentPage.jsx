import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Package, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardBody, Input, Select, Button, Alert } from '../../components/ui';

const schema = yup.object({
  senderName: yup.string().required('Sender name is required'),
  senderPhone: yup.string().required('Sender phone is required'),
  senderAddress: yup.string().required('Sender address is required'),
  receiverName: yup.string().required('Receiver name is required'),
  receiverPhone: yup.string().required('Receiver phone is required'),
  receiverAddress: yup.string().required('Receiver address is required'),
  origin: yup.string().required('Origin is required'),
  destination: yup.string().required('Destination is required'),
  weight: yup.string().required('Weight is required'),
  pieces: yup.number().min(1, 'At least 1 piece').required('Pieces is required'),
  serviceType: yup.string().required('Service type is required'),
  amount: yup.number().min(0, 'Amount must be positive').required('Amount is required'),
});

const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Kochi',
];

export default function CreateShipmentPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [serverMsg, setServerMsg] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { pieces: 1, serviceType: 'Express' },
  });

  const onSubmit = async (_values) => {
    setServerError('');
    setServerMsg('');
    try {
      // await shipmentService.create(values);
      setServerMsg('Shipment created successfully!');
      setTimeout(() => navigate('/shipments/list'), 1500);
    } catch (err) {
      setServerError(err?.message || 'Failed to create shipment.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <Package className="text-brand-600" size={24} />
        <h1 className="text-2xl font-bold text-slate-800">New Shipment</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverMsg && <Alert variant="success">{serverMsg}</Alert>}
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Sender Details" />
            <CardBody>
              <div className="space-y-4">
                <Input label="Sender Name" error={errors.senderName?.message} {...register('senderName')} />
                <Input label="Sender Phone" error={errors.senderPhone?.message} {...register('senderPhone')} />
                <Input label="Sender Address" error={errors.senderAddress?.message} {...register('senderAddress')} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Receiver Details" />
            <CardBody>
              <div className="space-y-4">
                <Input label="Receiver Name" error={errors.receiverName?.message} {...register('receiverName')} />
                <Input label="Receiver Phone" error={errors.receiverPhone?.message} {...register('receiverPhone')} />
                <Input label="Receiver Address" error={errors.receiverAddress?.message} {...register('receiverAddress')} />
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Shipment Info" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Origin"
                options={CITIES}
                placeholder="Select origin"
                error={errors.origin?.message}
                {...register('origin')}
              />
              <Select
                label="Destination"
                options={CITIES}
                placeholder="Select destination"
                error={errors.destination?.message}
                {...register('destination')}
              />
              <Input label="Weight (kg)" type="number" step="0.1" error={errors.weight?.message} {...register('weight')} />
              <Input label="Pieces" type="number" min="1" error={errors.pieces?.message} {...register('pieces')} />
              <Select
                label="Service Type"
                options={['Express', 'Standard', 'Economy']}
                error={errors.serviceType?.message}
                {...register('serviceType')}
              />
              <Input label="Amount (₹)" type="number" step="1" error={errors.amount?.message} {...register('amount')} />
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Shipment</Button>
        </div>
      </form>
    </div>
  );
}
