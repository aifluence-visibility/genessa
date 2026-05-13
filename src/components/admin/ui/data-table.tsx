import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  className?: string;
  cell?: (row: T) => ReactNode;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  getRowKey,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)]">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--ink-50)]">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)] ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row, i) => (
            <tr key={getRowKey(row, i)} className="bg-[var(--ink-0)] hover:bg-[var(--ink-50)]/80">
              {columns.map((col) => {
                const content = col.cell ? col.cell(row) : String(row[col.key as keyof T] ?? "—");
                return (
                  <td key={`${getRowKey(row, i)}-${String(col.key)}`} className={`px-4 py-3 text-[var(--ink-800)] ${col.className ?? ""}`}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
