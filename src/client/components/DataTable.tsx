import { useId } from 'react';
import type { ReactNode } from 'react';
import { PANEL, SECTION_HEADING } from '../styles';

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
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  /** Stable identity per row; avoids using the array index as a React key. */
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export default function DataTable<T>({
  title,
  columns,
  rows,
  rowKey,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  // Associates the heading with the table for screen readers, without repeating
  // the title inside a <caption>.
  const headingId = useId();

  return (
    <section className={PANEL} aria-labelledby={headingId}>
      <div className="px-6 py-4 border-b border-line">
        <h3 id={headingId} className={SECTION_HEADING}>
          {title}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-surface-raised">
            <tr>
              {columns.map(column => (
                <th
                  key={column.label}
                  scope="col"
                  className={`px-6 py-3 text-xs font-semibold text-ink-dim uppercase tracking-wider ${
                    column.numeric ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-ink-dim">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={rowKey(row)}
                  className={`transition-colors hover:bg-amber/10 ${index % 2 === 1 ? 'bg-surface-raised/40' : ''}`}
                >
                  {columns.map(column => (
                    <td
                      key={column.label}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-ink-dim ${
                        column.numeric ? 'text-right tabular-nums font-mono font-medium text-ink' : 'text-left'
                      }`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
