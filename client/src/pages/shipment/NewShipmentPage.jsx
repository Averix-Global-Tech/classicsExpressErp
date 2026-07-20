import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import shipmentService from '../../services/shipmentService';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Select, Textarea, Card, CardHeader } from '../../components/ui';

const schema = yup.object().shape({
  shipmentType: yup.string().required('Shipment type is required'),
  otherShipmentType: yup.string().when('shipmentType', {
    is: 'Other',
    then: (schema) => schema.required('Please specify the shipment type'),
    otherwise: (schema) => schema.optional().nullable(),
  }),
  serviceType: yup.string().required('Service type is required'),
  destinationCountry: yup.string().required('Destination country is required'),
  sender: yup.object().shape({
    name: yup.string().required('Sender name is required'),
    phone: yup.string()
      .matches(/^\d{10}$/, 'Mobile number must contain exactly 10 digits.')
      .required('Sender phone is required'),
    email: yup.string().email('Invalid email').nullable(),
    address: yup.string().required('Sender address is required'),
  }),
  receiver: yup.object().shape({
    name: yup.string().required('Receiver name is required'),
    phone: yup.string()
      .matches(/^\d{10}$/, 'Mobile number must contain exactly 10 digits.')
      .required('Receiver phone is required'),
    email: yup.string().email('Invalid email').nullable(),
    address: yup.string().required('Receiver address is required'),
  }),
  package: yup.object().shape({
    numberOfPackages: yup.number().typeError('Must be a number').min(1).required(),
    weightValue: yup.number().typeError('Weight is required').moreThan(0, 'Weight must be greater than 0').required(),
    weightUnit: yup.string().required('Weight unit is required'),
    lengthValue: yup.number().typeError('Length is required').min(0, 'Cannot be negative').nullable().default(0),
    lengthUnit: yup.string().required(),
    widthValue: yup.number().typeError('Width is required').min(0, 'Cannot be negative').nullable().default(0),
    widthUnit: yup.string().required(),
    heightValue: yup.number().typeError('Height is required').min(0, 'Cannot be negative').nullable().default(0),
    heightUnit: yup.string().required(),
    shipmentValue: yup.number().typeError('Must be a number').min(0),
    description: yup.string(),
  }),
});

export default function NewShipmentPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      shipmentType: 'Parcel',
      otherShipmentType: '',
      serviceType: 'Economy',
      package: { 
        numberOfPackages: 1, 
        fragile: false,
        weightUnit: 'kg',
        lengthUnit: 'cm',
        widthUnit: 'cm',
        heightUnit: 'cm',
      },
    },
  });

  const watchShipmentType = watch('shipmentType');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await shipmentService.createShipment(data);
      toast.success(`Shipment booked — AWB ${res.shipment.awbNumber}`);
      navigate(`/shipment/${res.shipment._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to book shipment');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Book a Shipment</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Capture sender, receiver and package details to generate an AWB.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader title="Sender Details" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" required {...register('sender.name')} error={errors.sender?.name?.message} />
            <Input 
              label="Phone" 
              required 
              maxLength="10"
              onInput={(e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
              }}
              {...register('sender.phone')} 
              error={errors.sender?.phone?.message} 
            />
            <Input label="Email" {...register('sender.email')} error={errors.sender?.email?.message} />
            <div className="sm:col-span-2">
              <Textarea label="Address" required rows={2} {...register('sender.address')} error={errors.sender?.address?.message} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Receiver Details" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" required {...register('receiver.name')} error={errors.receiver?.name?.message} />
            <Input 
              label="Phone" 
              required 
              maxLength="10"
              onInput={(e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
              }}
              {...register('receiver.phone')} 
              error={errors.receiver?.phone?.message} 
            />
            <Input label="Email" {...register('receiver.email')} error={errors.receiver?.email?.message} />
            <div className="sm:col-span-2">
              <Textarea label="Address" required rows={2} {...register('receiver.address')} error={errors.receiver?.address?.message} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Shipment & Package Details" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Shipment Type"
              required
              options={['Document', 'Parcel', 'Freight', 'Other']}
              {...register('shipmentType')}
              error={errors.shipmentType?.message}
            />
            {watchShipmentType === 'Other' && (
              <Input 
                label="Please Specify" 
                placeholder="Enter shipment type..." 
                required 
                {...register('otherShipmentType')} 
                error={errors.otherShipmentType?.message} 
              />
            )}
            
            <Select
              label="Service Type"
              required
              options={['Express', 'Economy']}
              {...register('serviceType')}
              error={errors.serviceType?.message}
            />
            <Input label="Destination Country" required {...register('destinationCountry')} error={errors.destinationCountry?.message} />

            <Input type="number" min="1" label="No. of Packages" {...register('package.numberOfPackages')} error={errors.package?.numberOfPackages?.message} />
            
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input type="number" step="0.01" min="0" label="Weight" required {...register('package.weightValue')} error={errors.package?.weightValue?.message} />
              </div>
              <div className="w-24 mt-[25px]">
                <Select
                  options={[
                    { value: 'kg', label: 'kg' },
                    { value: 'g', label: 'g' },
                    { value: 'lb', label: 'lb' },
                    { value: 'oz', label: 'oz' },
                  ]}
                  {...register('package.weightUnit')}
                />
              </div>
            </div>

            <Input type="number" step="0.01" min="0" label="Shipment Value" {...register('package.shipmentValue')} error={errors.package?.shipmentValue?.message} />

            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input type="number" min="0" label="Length" {...register('package.lengthValue')} error={errors.package?.lengthValue?.message} />
              </div>
              <div className="w-24 mt-[25px]">
                <Select options={[{value:'cm',label:'cm'},{value:'in',label:'in'},{value:'mm',label:'mm'}]} {...register('package.lengthUnit')} />
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input type="number" min="0" label="Width" {...register('package.widthValue')} error={errors.package?.widthValue?.message} />
              </div>
              <div className="w-24 mt-[25px]">
                <Select options={[{value:'cm',label:'cm'},{value:'in',label:'in'},{value:'mm',label:'mm'}]} {...register('package.widthUnit')} />
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input type="number" min="0" label="Height" {...register('package.heightValue')} error={errors.package?.heightValue?.message} />
              </div>
              <div className="w-24 mt-[25px]">
                <Select options={[{value:'cm',label:'cm'},{value:'in',label:'in'},{value:'mm',label:'mm'}]} {...register('package.heightUnit')} />
              </div>
            </div>

            <div className="sm:col-span-3">
              <Textarea label="Package Description" rows={2} {...register('package.description')} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" className="rounded text-orange-600" {...register('package.fragile')} />
              Fragile — handle with care
            </label>
          </div>
        </Card>

        <Card>
          <CardHeader title="International Shipping Details" subtitle="Required for cross-border customs clearance." />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Country of Origin" {...register('international.countryOfOrigin')} />
            <Input label="HS Code" {...register('international.hsCode')} />
            <Input label="Commercial Invoice No." {...register('international.commercialInvoiceNumber')} />
            <Input label="Export Reason" {...register('international.exportReason')} />
            <div className="sm:col-span-2">
              <Textarea label="Customs Information" rows={2} {...register('international.customsInfo')} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/shipment/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Book Shipment
          </Button>
        </div>
      </form>
    </div>
  );
}
