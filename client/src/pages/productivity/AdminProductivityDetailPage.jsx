import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Barcode, Mail, FileSpreadsheet } from 'lucide-react';
import { Button, DataTable, StatCard, Spinner, Card } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import productivityService from '../../services/productivity.service';
import { ROLE_LABELS } from '../../utils/constants';

export default function AdminProductivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await productivityService.getAdminEmployeeProductivityDetail(id);
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      toast.error('Failed to load employee details');
      navigate('/productivity/admin');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (!data) return null;

  const { employee, stats, awbEntries, emailEntries } = data;

  const awbColumns = [
    { header: 'AWB Number', key: 'awbNumber', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.awbNumber}</span> },
    { header: 'Party Name', key: 'partyName' },
    { header: 'Destination', key: 'destinationCountry' },
    { header: 'Date', key: 'processingDate', render: (row) => new Date(row.processingDate).toLocaleDateString() },
    { header: 'Remarks', key: 'remarks' }
  ];

  const emailColumns = [
    { header: 'Ref Number', key: 'emailReferenceNumber', render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.emailReferenceNumber}</span> },
    { header: 'Subject', key: 'subject' },
    { header: 'Party Name', key: 'partyName' },
    { header: 'Related AWB', key: 'relatedAwbNumber' },
    { header: 'Date', key: 'resolutionDate', render: (row) => new Date(row.resolutionDate).toLocaleDateString() },
    { header: 'Remarks', key: 'remarks' }
  ];

  const handleExportCSV = (type) => {
    let headers, csvData, filename;
    
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const empIdStr = employee.employeeId || employee._id;

    if (type === 'awb') {
      if (!awbEntries.length) {
        toast.info('No AWB entries to export');
        return;
      }
      headers = ['AWB Number', 'Party Name', 'Destination Country', 'Processing Date', 'Remarks'];
      csvData = awbEntries.map(e => [e.awbNumber, e.partyName, e.destinationCountry, new Date(e.processingDate).toLocaleDateString(), e.remarks]);
      filename = `${empIdStr}_awb_productivity.csv`;
    } else {
      if (!emailEntries.length) {
        toast.info('No Email entries to export');
        return;
      }
      headers = ['Email Ref', 'Subject', 'Party Name', 'Related AWB', 'Resolution Date', 'Remarks'];
      csvData = emailEntries.map(e => [e.emailReferenceNumber, e.subject, e.partyName, e.relatedAwbNumber, new Date(e.resolutionDate).toLocaleDateString(), e.remarks]);
      filename = `${empIdStr}_email_productivity.csv`;
    }

    const csvContent = [
      headers.map(escapeCsv).join(','), 
      ...csvData.map(row => row.map(escapeCsv).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/productivity/admin')} className="shrink-0 p-2">
          <ArrowLeft size={20} className="text-slate-500 dark:text-slate-400" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {employee.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {employee.employeeId || employee._id} · {employee.department} · {ROLE_LABELS[employee.role] || employee.role}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* AWB Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Barcode className="text-orange-600" size={20} /> AWB Processing
            </h2>
            <Button variant="outline" size="sm" onClick={() => handleExportCSV('awb')}>
              <FileSpreadsheet size={14} className="mr-2 text-green-600" /> Export CSV
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Today" value={stats.awbs.today} trend={null} />
            <StatCard title="Total" value={stats.awbs.total} trend={null} />
          </div>
          <Card className="overflow-hidden">
            <DataTable 
              columns={awbColumns}
              data={awbEntries}
              emptyTitle="No AWBs"
              emptyMessage="This employee hasn't processed any AWBs."
            />
          </Card>
        </div>

        {/* Email Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Mail className="text-orange-600" size={20} /> Email Resolutions
            </h2>
            <Button variant="outline" size="sm" onClick={() => handleExportCSV('email')}>
              <FileSpreadsheet size={14} className="mr-2 text-green-600" /> Export CSV
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Today" value={stats.emails.today} trend={null} />
            <StatCard title="Total" value={stats.emails.total} trend={null} />
          </div>
          <Card className="overflow-hidden">
            <DataTable 
              columns={emailColumns}
              data={emailEntries}
              emptyTitle="No Emails"
              emptyMessage="This employee hasn't resolved any emails."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
