export type Row = Record<string, unknown>;

const pretty = (k: string) => k.replace(/_/g, ' ');

const cell = (v: unknown) =>
  v == null
    ? '–'
    : typeof v === 'number'
      ? Number.isInteger(v)
        ? v.toLocaleString()
        : v.toFixed(2)
      : String(v);

export default function RowsView({ rows }: { rows: Row[] }) {
  if (!rows.length)
    return (
      <p className="text-sm text-ink-dim">
        No data for this selection.
      </p>
    );

  const cols = Object.keys(rows[0]);

  // A single row reads better as stat cards than as a one-line table.
  if (rows.length === 1)
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cols.map((c) => (
          <div
            key={c}
            className="rounded-lg border border-line bg-input p-3"
          >
            <div className="text-xs uppercase font-semibold text-ink-dim">
              {pretty(c)}
            </div>

            <div className="text-xl font-semibold text-ink">
              {cell(rows[0][c])}
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="max-h-[480px] overflow-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-surface-raised text-xs uppercase text-ink-dim">
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                className="px-3 py-2 font-semibold"
              >
                {pretty(c)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-t border-line text-ink transition-colors hover:bg-surface-raised/60"
            >
              {cols.map((c) => (
                <td key={c} className="px-3 py-2">
                  {cell(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}