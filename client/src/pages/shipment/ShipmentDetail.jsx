import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, MapPin, Clock, ShieldCheck, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import shipmentService from '../../services/shipmentService';
import { useToast } from '../../context/ToastContext';
import { Spinner, Button, Card, Badge, Select, Textarea } from '../../components/ui';

const OPERATOR_ROLES = [
  ROLES.SYSTEM_ADMIN,
  ROLES.ADMIN,
  ROLES.BRANCH_MANAGER,
  ROLES.DISPATCHER,
  ROLES.CUSTOMER_SERVICE,
];

const STATUS_OPTIONS = [
  'Booked', 'Pickup Scheduled', 'Picked Up', 'At Origin Hub', 'Export Customs',
  'In Transit', 'Arrived Destination Country', 'Import Customs', 'Out For Delivery',
  'Delivered', 'Returned', 'Cancelled', 'Lost',
];

const EXCEPTION_STATUSES = ['Returned', 'Cancelled', 'Lost'];

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isOperator = OPERATOR_ROLES.includes(user?.role);

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextStatus, setNextStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await shipmentService.getDetails(id);
      setShipment(res.shipment);
      setNextStatus(res.shipment.status);
    } catch (err) {
      toast.error(err.message || 'Failed to load shipment');
      navigate('/shipment/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (nextStatus === shipment.status) {
      toast.warning('Select a different status to update.');
      return;
    }
    if (EXCEPTION_STATUSES.includes(nextStatus) && !remarks.trim()) {
      toast.error(`Remarks are required when marking a shipment as ${nextStatus}.`);
      return;
    }
    setUpdating(true);
    try {
      const res = await shipmentService.updateStatus(id, { status: nextStatus, remarks });
      setShipment(res.shipment);
      setRemarks('');
      toast.success(`Status updated to ${nextStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (!shipment) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{shipment.awbNumber}</h1>
          <Badge>{shipment.status}</Badge>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Booked {new Date(shipment.createdAt).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <Send size={14} /> Sender
                </h3>
                <p className="font-medium text-slate-800 dark:text-slate-200">{shipment.sender.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{shipment.sender.phone}</p>
                {shipment.sender.email && <p className="text-sm text-slate-500 dark:text-slate-400">{shipment.sender.email}</p>}
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{shipment.sender.address}</p>
              </div>
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <MapPin size={14} /> Receiver
                </h3>
                <p className="font-medium text-slate-800 dark:text-slate-200">{shipment.receiver.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{shipment.receiver.phone}</p>
                {shipment.receiver.email && <p className="text-sm text-slate-500 dark:text-slate-400">{shipment.receiver.email}</p>}
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{shipment.receiver.address}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Package size={14} /> Package Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-slate-400">Type</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.shipmentType}</p></div>
              <div><p className="text-slate-400">Service</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.serviceType}</p></div>
              <div><p className="text-slate-400">Packages</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.package.numberOfPackages}</p></div>
              <div><p className="text-slate-400">Weight</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.package.weight} kg</p></div>
              <div><p className="text-slate-400">Dimensions</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.package.dimensions.length}×{shipment.package.dimensions.width}×{shipment.package.dimensions.height} cm</p></div>
              <div><p className="text-slate-400">Value</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.package.shipmentValue}</p></div>
              <div><p className="text-slate-400">Fragile</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.package.fragile ? 'Yes' : 'No'}</p></div>
              <div><p className="text-slate-400">Destination</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.destinationCountry}</p></div>
            </div>
            {shipment.package.description && (
              <p className="mt-3 border-t border-slate-100 dark:border-navy-800 pt-3 text-sm text-slate-600 dark:text-slate-400">{shipment.package.description}</p>
            )}
          </Card>

          {(shipment.international?.hsCode || shipment.international?.customsInfo || shipment.international?.commercialInvoiceNumber) && (
            <Card>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <ShieldCheck size={14} /> International Shipping Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><p className="text-slate-400">Country of Origin</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.international.countryOfOrigin || '—'}</p></div>
                <div><p className="text-slate-400">HS Code</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.international.hsCode || '—'}</p></div>
                <div><p className="text-slate-400">Invoice No.</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.international.commercialInvoiceNumber || '—'}</p></div>
                <div><p className="text-slate-400">Export Reason</p><p className="font-medium text-slate-800 dark:text-slate-200">{shipment.international.exportReason || '—'}</p></div>
              </div>
              {shipment.international.customsInfo && (
                <p className="mt-3 border-t border-slate-100 dark:border-navy-800 pt-3 text-sm text-slate-600 dark:text-slate-400">{shipment.international.customsInfo}</p>
              )}
            </Card>
          )}

          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Clock size={14} /> Shipment Timeline
            </h3>
            <div className="space-y-4">
              {shipment.timeline.map((t, i) => (
                <div key={i} className="flex gap-3 border-l-2 border-orange-200 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{t.status}</p>
                      <span className="text-xs text-slate-400">{new Date(t.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.employee?.name || 'System'}{t.branch ? ` · ${t.branch}` : ''}
                    </p>
                    {t.remarks && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 italic">{t.remarks}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {isOperator && !['Delivered', 'Cancelled'].includes(shipment.status) && (
            <Card>
              <h3 className="mb-4 font-semibold text-slate-800 dark:text-slate-200">Update Status</h3>
              <div className="space-y-3">
                <Select
                  label="New Status"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  options={STATUS_OPTIONS}
                />
                <Textarea
                  label="Remarks"
                  rows={2}
                  placeholder="Optional remarks (required for Returned / Cancelled / Lost)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <Button className="w-full" onClick={handleUpdateStatus} loading={updating}>
                  Update Status
                </Button>
              </div>
            </Card>
          )}

          <Card>
            <h3 className="mb-4 font-semibold text-slate-800 dark:text-slate-200">Booking Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Booked By</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{shipment.bookedBy?.name || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-navy-800 pb-2">
                <span className="text-slate-500 dark:text-slate-400">Branch</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{shipment.branch || '—'}</span>
              </div>
              {shipment.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Delivered On</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(shipment.deliveredAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </Card>

          {isOperator && (
            <Card>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Audit Log</h3>
              <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
                {shipment.auditLog.map((log, i) => (
                  <div key={i} className="border-l-2 border-slate-200 dark:border-navy-700 pl-3 text-xs">
                    <p className="font-medium text-slate-700 dark:text-slate-300">{log.action}</p>
                    <p className="text-slate-500 dark:text-slate-400">{log.modifiedBy?.name}</p>
                    {log.details && <p className="italic text-slate-500 dark:text-slate-400">{log.details}</p>}
                    <p className="mt-1 text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
