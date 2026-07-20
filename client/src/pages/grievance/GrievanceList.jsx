import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import grievanceService from '../../services/grievanceService';
import { Spinner, Button, Badge, Select } from '../../components/ui';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GrievanceList() {
  const { user } = useAuth();
  const isAdmin = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN].includes(user?.role);
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Admin pagination/filters
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        
        const res = await grievanceService.getAllGrievances(params);
        setItems(res.items);
        setPagination(res.pagination);
      } else {
        const res = await grievanceService.getMyGrievances();
        // Client side filtering for employee
        let filtered = res.grievances;
        if (search) {
          filtered = filtered.filter(g => 
            g.ticketNumber.toLowerCase().includes(search.toLowerCase()) || 
            g.subject.toLowerCase().includes(search.toLowerCase())
          );
        }
        if (statusFilter) {
          filtered = filtered.filter(g => g.status === statusFilter);
        }
        setItems(filtered);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          {isAdmin ? 'All Grievances' : 'My Grievances'}
        </h1>
      </div>

      <div className="bg-white dark:bg-navy-900 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Ticket # or Subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        <div className="w-48 shrink-0">
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Submitted', label: 'Submitted' },
              { value: 'Pending Review', label: 'Pending Review' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Resolved', label: 'Resolved' },
              { value: 'Closed', label: 'Closed' }
            ]}
          />
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-navy-900 rounded-lg shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-navy-900/50 text-slate-600 dark:text-slate-400 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Ticket #</th>
                {isAdmin && <th className="px-6 py-4 font-medium">Employee</th>}
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center">
                    <Spinner className="mx-auto" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50 dark:bg-navy-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-blue-600">{item.ticketNumber}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.employee?.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.employee?.department}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 max-w-[200px] truncate" title={item.subject}>{item.subject}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.category}</td>
                    <td className="px-6 py-4">
                      <Badge>
                        {item.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/grievance/${item._id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye size={16} /> View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {isAdmin && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50 dark:bg-navy-900/50">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {pagination.page} of {pagination.pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                disabled={page === pagination.pages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
