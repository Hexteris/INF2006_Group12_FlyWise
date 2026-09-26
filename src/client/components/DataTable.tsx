import { useId, memo } from 'react';
import type { ReactNode } from 'react';
import { PANEL, SECTION_HEADING, SKELETON_CLASSES, FOCUS_VISIBLE, MOBILE_ONLY, DESKTOP_ONLY } from '../styles';

/**
 * A column describes how to render a cell from a row, rather than naming a key
 * and a formatter. That keeps the table fully type-safe - `render` receives the
 * real row type, so a renamed field is a compile error instead of an `undefined`
 * appearing in the UI - and it removes the `any` the previous key-based version
 * needed to index arbitrary rows.
 */
export interface Column<T> {
  label: string;
  render: (row: T) => ReactNode;
  /** Right-aligns the column, for figures that should read against a common edge. */
  numeric?: boolean;
  /** Minimum width for responsive design */
  minWidth?: string;
  /** Whether to hide this column on mobile */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  /** Stable identity per row; avoids using the array index as a React key. */
  rowKey: (row: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingRows?: number;
}

function DataTable<T>({
  title,
  columns,
  rows,
  rowKey,
  emptyMessage = 'No data available',
  isLoading = false,
  loadingRows = 5,
}: DataTableProps<T>) {
  // Associates the heading with the table for screen readers, without repeating
  // the title inside a <caption>.
  const headingId = useId();

  // Filter columns based on screen size
  const visibleColumns = columns.filter(col => !col.hideOnMobile);

  // Generate skeleton rows for loading state
  const skeletonRows = Array.from({ length: loadingRows }, (_, i) => ({ id: `skeleton-${i}` }));

  return (
    <section 
      className={`${PANEL} flex flex-col h-full max-h-[600px] md:max-h-[700px]`} 
      aria-labelledby={headingId}
    >
      {/* Enhanced header with better spacing */}
      <div className="px-6 md:px-8 py-4 md:py-5 border-b border-line flex-shrink-0 bg-surface-raised/50">
        <div className="flex items-center justify-between">
          <h3 id={headingId} className={`${SECTION_HEADING} flex items-center gap-2`}>
            {isLoading ? (
              <>
                <span className={`${SKELETON_CLASSES} w-32 h-6`} aria-hidden="true">
                  {title}
                </span>
                <span className="sr-only">Loading {title}</span>
              </>
            ) : (
              <>
                {title}
                {rows.length > 0 && (
                  <span className="text-sm font-normal text-ink-dim bg-surface px-2 py-1 rounded-full ml-2">
                    {rows.length} {rows.length === 1 ? 'row' : 'rows'}
                  </span>
                )}
              </>
            )}
          </h3>
          <div className={`text-xs text-ink-dim/70 ${MOBILE_ONLY}`}>
            Scroll horizontally →
          </div>
        </div>
      </div>

      {/* Enhanced table container with better overflow handling */}
      <div className="flex-grow overflow-hidden flex flex-col relative">
        <div className="overflow-x-auto overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-surface-raised scrollbar-track-bg">
          <table className="min-w-full divide-y divide-line" aria-busy={isLoading}>
            <thead className="bg-surface-raised sticky top-0 z-10 shadow-sm">
              <tr>
                {visibleColumns.map((column, index) => (
                  <th
                    key={column.label}
                    scope="col"
                    className={`px-6 py-3.5 text-xs font-semibold text-ink-dim uppercase tracking-wider transition-colors duration-200 hover:text-ink ${
                      column.numeric ? 'text-right' : 'text-left'
                    } ${column.hideOnMobile ? DESKTOP_ONLY : ''}`}
                    style={column.minWidth ? { minWidth: column.minWidth } : undefined}
                    aria-sort="none"
                  >
                    {isLoading ? (
                      <div className={`${SKELETON_CLASSES} w-16 h-3 inline-block`} aria-label="Loading column header">
                        {column.label}
                      </div>
                    ) : (
                      <span className={`flex items-center gap-1.5 ${FOCUS_VISIBLE}`} tabIndex={0}>
                        {column.label}
                        <span className="text-ink-dim/40" aria-hidden="true">
                          {column.numeric ? '↕' : '↔'}
                        </span>
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-line/50">
              {isLoading ? (
                // Skeleton loading rows
                skeletonRows.map((skeleton) => (
                  <tr key={skeleton.id} className="animate-pulse">
                    {visibleColumns.map((column, colIndex) => (
                      <td
                        key={`${skeleton.id}-${colIndex}`}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          column.numeric ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div 
                          className={`${SKELETON_CLASSES} h-4`} 
                          style={{ 
                            width: `${70 + (colIndex * 10)}%`,
                            animationDelay: `${colIndex * 100}ms`
                          }}
                          aria-label="Loading cell data"
                        >
                          &nbsp;
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td 
                    colSpan={visibleColumns.length} 
                    className="px-6 py-12 text-center text-ink-dim/70"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg 
                        className="w-12 h-12 text-ink-dim/30" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-base font-medium">{emptyMessage}</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={rowKey(row)}
                    className={`group transition-all duration-300 hover:bg-amber/5 hover:shadow-sm ${
                      index % 2 === 1 ? 'bg-surface-raised/30' : ''
                    } ${FOCUS_VISIBLE}`}
                    tabIndex={0}
                    aria-label={`Row ${index + 1} of ${rows.length}`}
                  >
                    {visibleColumns.map((column) => (
                      <td
                        key={`${rowKey(row)}-${column.label}`}
                        className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 group-hover:text-ink ${
                          column.numeric 
                            ? 'text-right tabular-nums font-mono font-medium text-ink group-hover:text-amber' 
                            : 'text-left text-ink-dim group-hover:text-ink'
                        } ${column.hideOnMobile ? DESKTOP_ONLY : ''}`}
                      >
                        <div className={`inline-flex items-center gap-2 ${FOCUS_VISIBLE}`} tabIndex={0}>
                          {column.render(row)}
                          {column.numeric && (
                            <span className="text-ink-dim/30 group-hover:text-amber/30 transition-colors duration-200" aria-hidden="true">
                              ▸
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced footer with table information */}
        {!isLoading && rows.length > 0 && (
          <div className="border-t border-line bg-surface-raised/50 px-6 py-3 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-ink-dim">
              <span>
                Showing <span className="font-semibold text-ink">{rows.length}</span> {rows.length === 1 ? 'row' : 'rows'}
              </span>
              <span className={`${MOBILE_ONLY} animate-pulse`}>
                ← Scroll horizontally →
              </span>
              <span className={`${DESKTOP_ONLY} flex items-center gap-1.5`}>
                <kbd className="px-1.5 py-0.5 bg-surface rounded border border-line text-xs">←</kbd>
                <kbd className="px-1.5 py-0.5 bg-surface rounded border border-line text-xs">→</kbd>
                to navigate
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Memoized component to prevent unnecessary re-renders
export default memo(DataTable, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.columns === nextProps.columns &&
    prevProps.rows === nextProps.rows &&
    prevProps.isLoading === nextProps.isLoading
  );
}) as typeof DataTable;
