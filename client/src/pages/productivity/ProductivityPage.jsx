import { useState } from 'react';
import { Zap } from 'lucide-react';
import { StatCard } from '../../components/ui';
import AwbTab from './AwbTab';
import EmailTab from './EmailTab';
import PerformanceTab from './PerformanceTab';
import ActivityTab from './ActivityTab';

const TABS = [
  { key: 'awb', label: 'AWB Management' },
  { key: 'email', label: 'Email Communications' },
  { key: 'performance', label: 'Performance' },
  { key: 'activity', label: 'Activity Log' },
];

export default function ProductivityPage() {
  const [activeTab, setActiveTab] = useState('awb');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="text-brand-600" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Productivity</h1>
          <p className="text-sm text-slate-500">Track operations, AWB management, and communications</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="AWBs Today" value={47} icon={Zap} accent="blue" trend={12} hint="vs yesterday" />
        <StatCard title="Emails Sent" value={128} icon={Zap} accent="green" />
        <StatCard title="Pending Actions" value={15} icon={Zap} accent="amber" />
        <StatCard title="Completion Rate" value="94%" icon={Zap} accent="purple" />
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'awb' && <AwbTab />}
        {activeTab === 'email' && <EmailTab />}
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'activity' && <ActivityTab />}
      </div>
    </div>
  );
}
