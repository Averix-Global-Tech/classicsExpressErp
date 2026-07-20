import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, ArrowLeft, MapPin, Calendar, Weight, IndianRupee, Trash2, Edit2, User, Building } from 'lucide-react';
import { Card, CardHeader, CardBody, Badge, Button, Spinner } from '../../components/ui';
import { formatDate } from '../../utils/format';
import shipmentService from '../../services/shipmentService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    shipmentService.getDetails(id)
      .then((data) => setShipment(data.shipment))
      .catch(() => {
        toast.error('Failed to load shipment details');
        navigate('/shipment/list');
      })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (!shipment) return null;

  const isAdmin = user?.role === ROLES.SYSTEM_ADMIN || user?.role === ROLES.ADMIN;
  const isOwner = shipment.bookedBy?._id === user?._id;
  const canEdit = isAdmin || (isOwner && shipment.status === 'Booked');

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await shipmentService.deleteShipment(id);
      toast.success('Shipment deleted successfully');
      navigate('/shipment/list');
    } catch (err) {
      toast.error('Failed to delete shipment');
      setIsDeleting(false);
    }
  };

  const lastUpdate = [...(shipment.auditLog || [])].reverse().find(log => log.action === 'UPDATED' || log.action === 'STATUS_CHANGED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/shipment/list')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Shipment {shipment.awbNumber}</h1>
            <p className="text-sm text-slate-500">Created {formatDate(shipment.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{shipment.status}</Badge>
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/shipment/${id}/edit`)}>
              <Edit2 size={16} className="mr-2" /> Edit
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" size="sm" loading={isDeleting} onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Shipment Details" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={Package} label="AWB Number" value={shipment.awbNumber} />
                <InfoRow icon={MapPin} label="Service Type" value={shipment.serviceType} />
                <InfoRow icon={MapPin} label="Destination Country" value={shipment.destinationCountry} />
                <InfoRow icon={Weight} label="Weight" value={`${shipment.package?.weight || 0} kg`} />
                <InfoRow icon={Package} label="Pieces" value={shipment.package?.dimensions || 'N/A'} />
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader title="Sender" />
              <CardBody>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{shipment.sender?.name}</p>
                  <p className="text-slate-500">{shipment.sender?.phone}</p>
                  <p className="text-slate-500">{shipment.sender?.address}</p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Receiver" />
              <CardBody>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{shipment.receiver?.name}</p>
                  <p className="text-slate-500">{shipment.receiver?.phone}</p>
                  <p className="text-slate-500">{shipment.receiver?.address}</p>
                </div>
              </CardBody>
            </Card>
          </div>
          
          <Card>
            <CardHeader title="Record Information" />
            <CardBody>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={User} label="Created By" value={shipment.bookedBy?.name || 'Unknown'} />
                <InfoRow icon={User} label="Employee ID" value={shipment.bookedBy?.employeeId || shipment.bookedBy?._id || 'N/A'} />
                <InfoRow icon={Building} label="Branch" value={shipment.branch || 'Main'} />
                <InfoRow icon={Calendar} label="Created On" value={formatDate(shipment.createdAt)} />
                {lastUpdate && (
                  <>
                    <InfoRow icon={User} label="Last Updated By" value={lastUpdate.modifiedBy?.name || 'System'} />
                    <InfoRow icon={Calendar} label="Last Updated Date" value={formatDate(lastUpdate.timestamp)} />
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Tracking Timeline" />
            <CardBody>
              <div className="space-y-4">
                {shipment.timeline?.map((event, i) => (
                  <div key={i} className="relative pl-6">
                    {i < shipment.timeline.length - 1 && (
                      <div className="absolute left-[7px] top-5 h-full w-px bg-slate-200 dark:bg-slate-700" />
                    )}
                    <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand-500 bg-white dark:bg-navy-900" />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{event.status}</p>
                      <p className="text-xs text-slate-500">{event.branch || 'Unknown Branch'}</p>
                      <p className="text-xs text-slate-400">{formatDate(event.timestamp || event.createdAt || new Date())}</p>
                      {event.remarks && <p className="mt-0.5 text-xs text-slate-400">{event.remarks}</p>}
                    </div>
                  </div>
                ))}
                {(!shipment.timeline || shipment.timeline.length === 0) && (
                  <p className="text-sm text-slate-500">No timeline events yet.</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}
