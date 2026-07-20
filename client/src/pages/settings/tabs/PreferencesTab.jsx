import { useState } from 'react';
import { Moon, Languages, Globe, Clock, Palette } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Select } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';

function PreferenceRow({ icon: Icon, label, description, value, options, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-navy-800">
          <Icon size={17} className="text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 w-56 shrink-0">
        <Select 
          options={options} 
          value={value} 
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default function PreferencesTab({ settings }) {
  const { theme, setTheme } = useTheme();
  
  // UI foundation state for Language and Timezone
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState(settings?.preferences?.timezone || 'Asia/Kolkata');

  const themeOptions = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'system', label: 'System Default' },
    { value: 'midnight', label: 'Midnight Blue (Preview)' },
    { value: 'forest', label: 'Forest Green (Preview)' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English (US)' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'hi', label: 'Hindi (हिंदी)' },
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC / GMT' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (BST/GMT)' },
    { value: 'Europe/Paris', label: 'Central European (CET)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern (AEST)' },
  ];

  const handleThemeChange = (val) => {
    setTheme(val);
  };

  return (
    <div className="space-y-4">
      <div className="divide-y divide-slate-100 dark:divide-navy-700/50 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-4">
        <PreferenceRow
          icon={Palette}
          label="Theme"
          description="Switch between available color schemes and modes"
          value={theme}
          options={themeOptions}
          onChange={handleThemeChange}
        />
        <PreferenceRow
          icon={Languages}
          label="Language"
          description="Choose your preferred display language"
          value={language}
          options={languageOptions}
          onChange={setLanguage}
        />
        <PreferenceRow
          icon={Clock}
          label="Time Zone"
          description="Dates and times will be displayed in this timezone"
          value={timezone}
          options={timezoneOptions}
          onChange={setTimezone}
        />
      </div>
    </div>
  );
}
