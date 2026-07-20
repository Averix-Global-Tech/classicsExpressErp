import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Package, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardBody, Input, Select, Button, Alert, Spinner } from '../../components/ui';
import shipmentService from '../../services/shipmentService';

const schema = yup.object({
  shipmentType: yup.string().required('Shipment type is required'),
  otherShipmentType: yup.string().when('shipmentType', {
    is: 'Other',
    then: (s) => s.required('Please specify the shipment type'),
    otherwise: (s) => s.optional().nullable(),
  }),
  senderName: yup.string().required('Sender name is required'),
  senderPhone: yup.string().matches(/^\d{10}$/, 'Mobile number must contain exactly 10 digits.').required('Sender phone is required'),
  senderAddress: yup.string().required('Sender address is required'),
  receiverName: yup.string().required('Receiver name is required'),
  receiverPhone: yup.string().matches(/^\d{10}$/, 'Mobile number must contain exactly 10 digits.').required('Receiver phone is required'),
  receiverAddress: yup.string().required('Receiver address is required'),
  destinationCountry: yup.string().required('Destination country is required'),
  weightValue: yup.number().typeError('Weight is required').moreThan(0, 'Weight must be greater than 0').required(),
  weightUnit: yup.string().required(),
  lengthValue: yup.number().typeError('Length must be a number').min(0, 'Cannot be negative').nullable().default(0),
  lengthUnit: yup.string().required(),
  widthValue: yup.number().typeError('Width must be a number').min(0, 'Cannot be negative').nullable().default(0),
  widthUnit: yup.string().required(),
  heightValue: yup.number().typeError('Height must be a number').min(0, 'Cannot be negative').nullable().default(0),
  heightUnit: yup.string().required(),
  serviceType: yup.string().required('Service type is required'),
});

const CITIES = [
  'India', 'USA', 'UK', 'Canada', 'Australia', 'UAE', 'Singapore', 'Germany'
];

export default function EditShipmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [serverMsg, setServerMsg] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  const watchShipmentType = watch('shipmentType');

  useEffect(() => {
    shipmentService.getDetails(id)
      .then((data) => {
        const { shipment } = data;
        const pkg = shipment.package || {};
        const dims = pkg.dimensions || {};
        reset({
          shipmentType: shipment.shipmentType || 'Parcel',
          otherShipmentType: shipment.otherShipmentType || '',
          senderName: shipment.sender?.name || '',
          senderPhone: shipment.sender?.phone || '',
          senderAddress: shipment.sender?.address || '',
          receiverName: shipment.receiver?.name || '',
          receiverPhone: shipment.receiver?.phone || '',
          receiverAddress: shipment.receiver?.address || '',
          destinationCountry: shipment.destinationCountry || '',
          
          weightValue: pkg.weightValue !== undefined ? pkg.weightValue : (pkg.weight || 0),
          weightUnit: pkg.weightUnit || 'kg',
          
          lengthValue: pkg.lengthValue !== undefined ? pkg.lengthValue : (dims.length || 0),
          lengthUnit: pkg.lengthUnit || 'cm',
          widthValue: pkg.widthValue !== undefined ? pkg.widthValue : (dims.width || 0),
          widthUnit: pkg.widthUnit || 'cm',
          heightValue: pkg.heightValue !== undefined ? pkg.heightValue : (dims.height || 0),
          heightUnit: pkg.heightUnit || 'cm',
          
          serviceType: shipment.serviceType || 'Standard',
        });
      })
      .catch((err) => {
        setServerError(err?.response?.data?.message || 'Failed to load shipment');
      })
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    setServerMsg('');
    try {
      const payload = {
        shipmentType: values.shipmentType,
        otherShipmentType: values.shipmentType === 'Other' ? values.otherShipmentType : '',
        serviceType: values.serviceType,
        destinationCountry: values.destinationCountry,
        sender: {
          name: values.senderName,
          phone: values.senderPhone,
          address: values.senderAddress,
        },
        receiver: {
          name: values.receiverName,
          phone: values.receiverPhone,
          address: values.receiverAddress,
        },
        package: {
          weightValue: values.weightValue,
          weightUnit: values.weightUnit,
          lengthValue: values.lengthValue,
          lengthUnit: values.lengthUnit,
          widthValue: values.widthValue,
          widthUnit: values.widthUnit,
          heightValue: values.heightValue,
          heightUnit: values.heightUnit,
        }
      };
      
      await shipmentService.updateShipment(id, payload);
      setServerMsg('Shipment updated successfully!');
      setTimeout(() => navigate(`/shipment/${id}`), 1000);
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Failed to update shipment.');
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <Package className="text-brand-600" size={24} />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Shipment</h1>
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
                <Input 
                  label="Sender Phone" 
                  maxLength="10"
                  onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                  error={errors.senderPhone?.message} 
                  {...register('senderPhone')} 
                />
                <Input label="Sender Address" error={errors.senderAddress?.message} {...register('senderAddress')} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Receiver Details" />
            <CardBody>
              <div className="space-y-4">
                <Input label="Receiver Name" error={errors.receiverName?.message} {...register('receiverName')} />
                <Input 
                  label="Receiver Phone" 
                  maxLength="10"
                  onInput={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
                  error={errors.receiverPhone?.message} 
                  {...register('receiverPhone')} 
                />
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
                label="Shipment Type"
                options={['Document', 'Parcel', 'Freight', 'Other']}
                error={errors.shipmentType?.message}
                {...register('shipmentType')}
              />
              {watchShipmentType === 'Other' && (
                <Input 
                  label="Please Specify" 
                  placeholder="Enter shipment type..." 
                  {...register('otherShipmentType')} 
                  error={errors.otherShipmentType?.message} 
                />
              )}
              <Select
                label="Destination Country"
                options={CITIES}
                error={errors.destinationCountry?.message}
                {...register('destinationCountry')}
              />
              <Select
                label="Service Type"
                options={['Express', 'Standard', 'Economy']}
                error={errors.serviceType?.message}
                {...register('serviceType')}
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input type="number" step="0.01" label="Weight" error={errors.weightValue?.message} {...register('weightValue')} />
                </div>
                <div className="w-24 mt-[25px]">
                  <Select
                    options={[{ value: 'kg', label: 'kg' }, { value: 'g', label: 'g' }, { value: 'lb', label: 'lb' }, { value: 'oz', label: 'oz' }]}
                    {...register('weightUnit')}
                  />
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input type="number" step="0.01" label="Length" error={errors.lengthValue?.message} {...register('lengthValue')} />
                </div>
                <div className="w-24 mt-[25px]">
                  <Select options={[{value:'cm',label:'cm'},{value:'in',label:'in'},{value:'mm',label:'mm'}]} {...register('lengthUnit')} />
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input type="number" step="0.01" label="Width" error={errors.widthValue?.message} {...register('widthValue')} />
                </div>
                <div className="w-24 mt-[25px]">
                  <Select options={[{value:'cm',label:'cm'},{value:'in',label:'in'},{value:'mm',label:'mm'}]} {...register('widthUnit')} />
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input type="number" step="0.01" label="Height" error={errors.heightValue?.message} {...register('heightValue')} />
                </div>
                <div className="w-24 mt-[25px]">
                  <Select options={[{value:'cm',label:'cm'},{value:'in',label:'in'},{value:'mm',label:'mm'}]} {...register('heightUnit')} />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
