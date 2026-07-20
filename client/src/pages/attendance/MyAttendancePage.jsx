import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, CheckCircle, 
  XCircle, AlertCircle, RefreshCw, Sun, CheckCircle2 
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../context/ToastContext';
import { Button, Spinner, Badge } from '../../components/ui';

const getCalendarDotColor = (status, isLate, approvalStatus) => {
  if (['Pending Check-In', 'Pending Check-Out'].includes(approvalStatus)) return 'bg-orange-500';
  if (status === 'Present') return isLate ? 'bg-amber-500' : 'bg-emerald-500';
  if (status === 'Absent') return 'bg-rose-500';
  if (status === 'Half Day') return 'bg-yellow-500';
  if (status === 'Leave') return 'bg-blue-500';
  if (status === 'Holiday') return 'bg-purple-500';
  if (status === 'Weekend') return 'bg-slate-800';
  return 'bg-transparent';
};

export default function MyAttendancePage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ today: null, records: [], summary: {} });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchAttendance = async (date) => {
    setLoading(true);
    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const res = await attendanceService.getMyAttendance(month, year);
      setData(res);
    } catch (err) {
      toast.error('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(currentDate);
  }, [currentDate]);

  const handleCheckIn = async () => {
    try {
      await attendanceService.checkIn();
      toast.success('Check-in submitted for approval.');
      fetchAttendance(currentDate);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to check in.');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceService.checkOut();
      toast.success('Check-out submitted for approval.');
      fetchAttendance(currentDate);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to check out.');
    }
  };

  // Calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), d)).toISOString().split('T')[0];
    const record = data.records.find(r => r.date.startsWith(dateStr));
    return { day: d, record };
  });

  const getRecordForSelected = () => {
    if (!selectedRecord) return null;
    return data.records.find(r => r.date.startsWith(selectedRecord));
  };

  if (loading && !data.records.length) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  const { today, summary } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Attendance</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your daily attendance, working hours, and monthly summaries.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left Column: Today & Summary ── */}
        <div className="space-y-6">
          
          {/* Today's Attendance Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Today&apos;s Attendance</h2>
              <Clock className="text-slate-400" size={20} />
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Date</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                {today ? (
                  <Badge>
                    {today.approvalStatus}
                  </Badge>
                ) : (
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Not Checked In</span>
                )}
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Working Hours</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {today?.workingMinutes ? `${(today.workingMinutes / 60).toFixed(1)} hrs` : '0.0 hrs'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleCheckIn}
                disabled={!!today || loading}
                className="w-full justify-center"
              >
                Check In
              </Button>
              <Button 
                variant="secondary"
                onClick={handleCheckOut}
                disabled={!today || today.approvalStatus !== 'Checked In' || loading}
                className="w-full justify-center"
              >
                Check Out
              </Button>
            </div>
            
            {today && today.approvalStatus?.includes('Pending') && (
              <p className="mt-3 text-xs text-center text-orange-600 flex items-center justify-center gap-1">
                <RefreshCw size={12} className="animate-spin" />
                Waiting for admin approval
              </p>
            )}
          </div>

          {/* Monthly Summary */}
          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Monthly Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 dark:bg-navy-900/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Present</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{summary.present || 0}</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-navy-900/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Absent</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{summary.absent || 0}</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-navy-900/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Late</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{summary.late || 0}</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-navy-900/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Leave / Half Day</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{(summary.leave || 0) + (summary.halfDay || 0)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-navy-900/50 p-3 col-span-2 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Hours</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{summary.workingHours || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Overtime</p>
                  <p className="text-xl font-bold text-orange-600">{summary.overtimeHours || 0}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Column: Calendar ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Attendance Calendar</h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="text-slate-400 hover:text-slate-700 dark:text-slate-300"
                >
                  &larr; Prev
                </button>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="text-slate-400 hover:text-slate-700 dark:text-slate-300"
                >
                  Next &rarr;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Empty padding days */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 md:h-20 rounded-lg border border-transparent bg-slate-50 dark:bg-navy-900/50/50"></div>
              ))}
              
              {/* Actual days */}
              {days.map(({ day, record }) => {
                const dateStr = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day)).toISOString().split('T')[0];
                const isSelected = selectedRecord === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                const isFuture = new Date(dateStr) > new Date();

                return (
                  <button
                    key={day}
                    disabled={isFuture}
                    onClick={() => setSelectedRecord(dateStr)}
                    className={`relative flex flex-col items-center justify-center rounded-lg border h-14 md:h-20 transition-all ${
                      isFuture ? 'bg-slate-50 dark:bg-navy-900/50/50 opacity-50 cursor-not-allowed' : 'hover:border-orange-300 hover:bg-orange-50'
                    } ${
                      isSelected ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50' : 'border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900'
                    } ${
                      isToday ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <span className={`text-sm font-medium ${isToday ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {day}
                    </span>
                    
                    {/* Status Dot */}
                    {record && (
                      <div className={`mt-1 h-2 w-2 rounded-full ${getCalendarDotColor(record.status, record.isLate, record.approvalStatus)}`}></div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 border-t pt-4">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500"></div> Present</div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500"></div> Late</div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-rose-500"></div> Absent</div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-yellow-500"></div> Half Day</div>
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-orange-500"></div> Pending</div>
            </div>
          </div>

          {/* Selected Record Details */}
          {selectedRecord && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3 mb-4">
                <h3 className="font-semibold text-orange-900">
                  Details for {new Date(selectedRecord).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <button onClick={() => setSelectedRecord(null)} className="text-orange-400 hover:text-orange-600">
                  <XCircle size={18} />
                </button>
              </div>

              {(() => {
                const rec = getRecordForSelected();
                if (!rec) return <p className="text-sm text-orange-600">No attendance record found for this date.</p>;
                
                return (
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <span className="text-orange-600/70 block text-xs">Check In</span>
                      <span className="font-medium text-orange-900">
                        {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-orange-600/70 block text-xs">Check Out</span>
                      <span className="font-medium text-orange-900">
                        {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                    <div>
                      <span className="text-orange-600/70 block text-xs">Status</span>
                      <Badge>
                        {rec.status} {rec.isLate && '(Late)'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-orange-600/70 block text-xs">Workflow</span>
                      <span className="font-medium text-orange-900">{rec.approvalStatus}</span>
                    </div>
                    {rec.rejectionReason && (
                      <div className="col-span-2 bg-red-50 border border-red-100 p-3 rounded-lg mt-2">
                        <span className="text-red-800 text-xs font-semibold block mb-1">Rejection Reason:</span>
                        <span className="text-red-700">{rec.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
