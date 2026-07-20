import { RefreshCw, Download } from 'lucide-react';
import Button from './Button';

// Page-level toolbar: wraps search/filter children + standard action buttons.
// Prop API stable: onRefresh, onExport, exporting, refreshing, children, className.
export function FilterBar({ onRefresh, onExport, exporting = false, refreshing = false, children, className }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button variant="secondary" size="md" onClick={onRefresh} loading={refreshing} title="Refresh">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        )}
        {onExport && (
          <Button variant="secondary" size="md" onClick={onExport} loading={exporting} title="Export">
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
