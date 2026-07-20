import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Eye, FileSpreadsheet } from 'lucide-react';
import { Button, DataTable, SearchBar } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import productivityService from '../../services/productivity.service';
import { ROLE_LABELS } from '../../utils/constants';

export default function AdminProductivityPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const toast = useToast();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productivityService.getAdminProductivityList({ search });
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (error) {
      toast.error('Failed to load employee productivity data');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = [
    {
      header: 'Employee Name',
      key: 'name',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-white">{row.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{row.employeeId || row._id}</div>
        </div>
      )
    },
    { 
      header: 'Department & Role', 
      key: 'deptRole',
      render: (row) => (
        <div>
          <div className="text-sm text-slate-800 dark:text-slate-200">{row.department}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[row.role] || row.role}</div>
        </div>
      )
    },
    {
      header: 'AWBs (Today / Month / Total)',
      key: 'awbStats',
      render: (row) => (
        <div className="text-sm">
          <span className="font-medium text-slate-900 dark:text-white">{row.awbStats.today}</span> / <span className="text-slate-600 dark:text-slate-400">{row.awbStats.month}</span> / <span className="text-slate-400">{row.awbStats.total}</span>
        </div>
      )
    },
    {
      header: 'Emails (Today / Month / Total)',
      key: 'emailStats',
      render: (row) => (
        <div className="text-sm">
          <span className="font-medium text-slate-900 dark:text-white">{row.emailStats.today}</span> / <span className="text-slate-600 dark:text-slate-400">{row.emailStats.month}</span> / <span className="text-slate-400">{row.emailStats.total}</span>
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/productivity/admin/${row._id}`)}>
          <Eye size={16} className="mr-2" /> View Details
        </Button>
      )
    }
  ];

  const handleExportCSV = () => {
    if (!employees.length) {
      toast.info('No data available to export');
      return;
    }
    
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const headers = ['Employee ID', 'Name', 'Department', 'Role', 'AWBs Today', 'AWBs Month', 'AWBs Total', 'Emails Today', 'Emails Month', 'Emails Total'];
    const csvData = employees.map(emp => [
      emp.employeeId || emp._id,
      emp.name,
      emp.department,
      ROLE_LABELS[emp.role] || emp.role,
      emp.awbStats?.today || 0,
      emp.awbStats?.month || 0,
      emp.awbStats?.total || 0,
      emp.emailStats?.today || 0,
      emp.emailStats?.month || 0,
      emp.emailStats?.total || 0
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...csvData.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'employee_productivity_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Activity className="text-orange-600" size={24} />
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Employee Productivity</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Monitor overall productivity across all employees</p>
          </div>
        </div>
        
        <Button variant="outline" onClick={handleExportCSV}>
          <FileSpreadsheet size={16} className="mr-2 text-green-600" /> Export CSV
        </Button>
      </div>

      <div className="w-full sm:w-72">
        <SearchBar 
          placeholder="Search Employee..." 
          value={search}
          onChange={setSearch}
          onSearch={loadData}
        />
      </div>

      <DataTable 
        columns={columns}
        data={employees}
        loading={loading}
        emptyTitle="No Employees Found"
        emptyMessage="Try adjusting your search criteria."
      />
    </div>
  );
}
