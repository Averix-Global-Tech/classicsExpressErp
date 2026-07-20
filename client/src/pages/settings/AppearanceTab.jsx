import { useState } from 'react';
import { Card, CardHeader, CardBody, Button } from '../../components/ui';
import { cn } from '../../utils/cn';

const THEMES = [
  { key: 'light', label: 'Light', description: 'Clean white background with blue accents' },
  { key: 'dark', label: 'Dark', description: 'Easy on the eyes for low-light environments' },
  { key: 'system', label: 'System', description: 'Follow your device appearance settings' },
];

const SIDEBAR_STYLES = [
  { key: 'compact', label: 'Compact', description: 'Narrow sidebar with icon-only navigation' },
  { key: 'comfortable', label: 'Comfortable', description: 'Default sidebar with labels and icons' },
];

export default function AppearanceTab() {
  const [theme, setTheme] = useState('light');
  const [sidebarStyle, setSidebarStyle] = useState('comfortable');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Appearance settings saved.
        </div>
      )}

      <Card>
        <CardHeader title="Theme" subtitle="Select your preferred color theme" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-3">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={cn(
                  'rounded-lg border-2 p-4 text-left transition',
                  theme === t.key
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2',
                      theme === t.key ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                    )}
                  />
                  <span className="text-sm font-medium text-slate-800">{t.label}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{t.description}</p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Sidebar" subtitle="Customize the sidebar layout" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2">
            {SIDEBAR_STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSidebarStyle(s.key)}
                className={cn(
                  'rounded-lg border-2 p-4 text-left transition',
                  sidebarStyle === s.key
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2',
                      sidebarStyle === s.key ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                    )}
                  />
                  <span className="text-sm font-medium text-slate-800">{s.label}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{s.description}</p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Content Density" subtitle="Adjust spacing and element sizes" />
        <CardBody>
          <p className="text-sm text-slate-500">
            Content density settings will be available in a future update. The current layout uses the
            default comfortable spacing.
          </p>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  );
}
