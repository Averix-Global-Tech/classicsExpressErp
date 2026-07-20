import { SearchBar, Select } from '../../components/ui';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Picked Up', label: 'Picked Up' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Out for Delivery', label: 'Out for Delivery' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Returned', label: 'Returned' },
];

const SERVICE_OPTIONS = [
  { value: '', label: 'All Services' },
  { value: 'Express', label: 'Express' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Economy', label: 'Economy' },
];

export default function ShipmentFilters({ search, onSearchChange, status, onStatusChange, service, onServiceChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder="Search AWB, sender, receiver..."
        className="w-full sm:w-72"
      />
      <Select
        options={STATUS_OPTIONS}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="w-full sm:w-44"
      />
      <Select
        options={SERVICE_OPTIONS}
        value={service}
        onChange={(e) => onServiceChange(e.target.value)}
        className="w-full sm:w-44"
      />
    </div>
  );
}
