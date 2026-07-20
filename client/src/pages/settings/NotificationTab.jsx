import { useState } from 'react';
import { Card, CardHeader, CardBody, Button, Alert } from '../../components/ui';

const DEFAULT_PREFS = {
  emailDispatch: true,
  emailDelivery: true,
  emailAlerts: true,
  emailReports: false,
  browserNotifications: true,
  soundEnabled: true,
};

export default function NotificationTab() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {saved && <Alert variant="success">Notification preferences saved.</Alert>}

      <Card>
        <CardHeader title="Email Notifications" subtitle="Choose which emails you want to receive" />
        <CardBody>
          <div className="space-y-4">
            <ToggleRow label="Shipment Dispatch Notifications" description="Get notified when shipments are dispatched" checked={prefs.emailDispatch} onChange={() => toggle('emailDispatch')} />
            <ToggleRow label="Delivery Confirmations" description="Get notified when shipments are delivered" checked={prefs.emailDelivery} onChange={() => toggle('emailDelivery')} />
            <ToggleRow label="System Alerts" description="Important system alerts and warnings" checked={prefs.emailAlerts} onChange={() => toggle('emailAlerts')} />
            <ToggleRow label="Weekly Reports" description="Receive weekly performance summary reports" checked={prefs.emailReports} onChange={() => toggle('emailReports')} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="In-App Notifications" subtitle="Browser and in-app notification preferences" />
        <CardBody>
          <div className="space-y-4">
            <ToggleRow label="Browser Notifications" description="Show desktop notifications for important events" checked={prefs.browserNotifications} onChange={() => toggle('browserNotifications')} />
            <ToggleRow label="Sound Alerts" description="Play a sound for critical notifications" checked={prefs.soundEnabled} onChange={() => toggle('soundEnabled')} />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-brand-600' : 'bg-slate-200'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
