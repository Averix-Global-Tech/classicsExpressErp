import { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import grievanceService from '../../services/grievanceService';
import { useToast } from '../../context/ToastContext';
import { Button, Spinner, Card, Input, Badge } from '../../components/ui';

export default function GrievanceSettingsPage() {
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    categories: [],
    slas: { 'Low': 120, 'Medium': 72, 'High': 48, 'Critical': 24 },
    maxAttachmentSizeMB: 5
  });
  
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await grievanceService.getSettings();
      setSettings(res);
    } catch (error) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await grievanceService.updateSettings(settings);
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCat.trim()) return;
    if (settings.categories.includes(newCat.trim())) {
      showToast('Category already exists', 'error');
      return;
    }
    setSettings({ ...settings, categories: [...settings.categories, newCat.trim()] });
    setNewCat('');
  };

  const removeCategory = (cat) => {
    setSettings({ ...settings, categories: settings.categories.filter(c => c !== cat) });
  };

  const updateSla = (priority, hours) => {
    setSettings({
      ...settings,
      slas: { ...settings.slas, [priority]: Number(hours) }
    });
  };

  if (loading) return <div className="flex h-64 justify-center items-center"><Spinner /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Grievance Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure categories, SLA rules, and limits</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-blue-600">
          {saving ? <Spinner size={16} /> : <Save size={16} />} Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* SLA Configuration */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-2">Service Level Agreements (SLA)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Set the expected resolution time in hours for each priority level.</p>
          
          <div className="space-y-4">
            {['Critical', 'High', 'Medium', 'Low'].map(priority => (
              <div key={priority} className="flex items-center justify-between gap-4">
                <Badge
                  className="w-24 justify-center"
                  color={priority === 'Critical' ? 'red' : priority === 'High' ? 'amber' : priority === 'Medium' ? 'blue' : 'grey'}
                >
                  {priority}
                </Badge>
                <div className="flex items-center gap-2 flex-1">
                  <Input 
                    type="number" 
                    value={settings.slas[priority] || ''}
                    onChange={(e) => updateSla(priority, e.target.value)}
                    className="w-24 text-center"
                    min="1"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Hours</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Categories & Limits */}
        <div className="space-y-8">
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-2">Grievance Categories</h3>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {settings.categories.map(cat => (
                <Badge key={cat} color="grey" className="gap-1 pr-1">
                  {cat}
                  <button onClick={() => removeCategory(cat)} className="text-slate-400 hover:text-red-500 rounded-full p-0.5 hover:bg-slate-200 transition-colors ml-0.5">
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input 
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="New Category Name"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button type="button" onClick={addCategory} variant="outline" className="gap-1">
                <Plus size={16} /> Add
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b pb-2">Upload Limits</h3>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Max Attachment Size (MB)</label>
              <Input 
                type="number" 
                value={settings.maxAttachmentSizeMB}
                onChange={(e) => setSettings({ ...settings, maxAttachmentSizeMB: Number(e.target.value) })}
                className="w-32"
                min="1"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Controls the maximum allowed size per file upload in Grievance tickets.</p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
