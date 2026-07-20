import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Skeleton } from './Spinner';
import { EmptyState } from './EmptyState';

// Reusable data table with dark mode, loading skeletons, empty state, sort headers.
// Prop API stable: columns, data, loading, emptyTitle, emptyDescription, onRowClick,
//                  sortKey, sortDir, onSort, rowKey.
export function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription,
  onRowClick,
  sortKey,
  sortDir,
  onSort,
  rowKey = '_id',
}) {
  const handleSort = (col) => {
    if (!col.sortable || !onSort) return;
    const dir = sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc';
    onSort(col.key, dir);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--fg-subtle)]',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className,
                  col.sortable && 'cursor-pointer select-none hover:text-[var(--fg-muted)]'
                )}
                onClick={() => handleSort(col)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-[10px] opacity-60">
                      {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--border)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <motion.tr
                key={row[rowKey] ?? i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className={cn(
                  'border-b border-[var(--border)] text-[var(--fg)] transition-colors duration-100',
                  onRowClick && 'cursor-pointer hover:bg-[var(--surface-hover)]'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.cellClassName
                    )}
                  >
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
