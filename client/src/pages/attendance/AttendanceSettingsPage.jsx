import { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../context/ToastContext';
import { Button, Spinner } from '../../components/ui';

export default function AttendanceSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    officeStartTime: '09:30',
    officeEndTime: '18:30',
    halfDayThresholdHours: 4,
    minimumWorkingHours: 8,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await attendanceService.getSettings();
        if (res.settings) {
          setSettings(res.settings);
        }
      } catch (err) {
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await attendanceService.updateSettings(settings);
      setSettings(res.settings);
      toast.success('Attendance settings updated successfully.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Attendance Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure organizational working hours, late arrival rules, and half-day thresholds.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/50 px-6 py-4 flex items-center gap-2">
          <Settings className="text-orange-600" size={20} />
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Global Configuration</h2>
        </div>
        
        <div className="p-6 space-y-8">
          
          {/* Office Timings */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 border-b pb-2">Office Timings</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Office Start Time</label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.officeStartTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, officeStartTime: e.target.value }))}
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Employees checking in after this time will be marked as Late.</p>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Office End Time</label>
                <input
                  type="time"
                  className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.officeEndTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, officeEndTime: e.target.value }))}
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Standard time for calculating overtime.</p>
              </div>
            </div>
          </div>

          {/* Working Hour Rules */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 border-b pb-2">Working Hour Rules</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Half Day Threshold (Hours)</label>
                <input
                  type="number"
                  min="1" max="12"
                  className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.halfDayThresholdHours}
                  onChange={(e) => setSettings(prev => ({ ...prev, halfDayThresholdHours: Number(e.target.value) }))}
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Working fewer than these hours will trigger a Half Day.</p>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Minimum Working Hours</label>
                <input
                  type="number"
                  min="1" max="24"
                  className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={settings.minimumWorkingHours}
                  onChange={(e) => setSettings(prev => ({ ...prev, minimumWorkingHours: Number(e.target.value) }))}
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Required minimum hours for a full day present status.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button className="gap-2" onClick={handleSave} loading={saving}>
              <Save size={16} />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
