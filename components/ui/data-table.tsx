"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Sort comparator. Presence of this makes the column sortable. */
  sortBy?: (row: T) => string | number;
  /** Drop the column below this breakpoint to keep dense tables readable. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  align?: "start" | "end";
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  /** Shown when `data` is empty and not loading. */
  empty?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /**
   * Below `md` the table is replaced by these cards. A table forced into
   * 375px either scrolls horizontally or crushes Bangla labels into two-letter
   * fragments — neither is acceptable, so admin lists get a real card layout.
   */
  renderMobileCard?: (row: T) => React.ReactNode;
  caption?: string;
  className?: string;
}

const HIDE_BELOW = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

export function DataTable<T>({
  data,
  columns,
  getRowId,
  isLoading = false,
  empty,
  onRowClick,
  renderMobileCard,
  caption,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const rows = useMemo(() => {
    if (!sort) return data;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortBy) return data;

    return [...data].sort((a, b) => {
      const av = column.sortBy!(a);
      const bv = column.sortBy!(b);
      if (av === bv) return 0;
      const result = av < bv ? -1 : 1;
      return sort.dir === "asc" ? result : -result;
    });
  }, [data, columns, sort]);

  function toggleSort(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" },
    );
  }

  if (isLoading) {
    return <DataTableSkeleton columns={columns.length} />;
  }

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className={className}>
      {/* mobile cards */}
      {renderMobileCard && (
        <div className="flex flex-col gap-3 md:hidden">
          {rows.map((row) => (
            <div key={getRowId(row)}>{renderMobileCard(row)}</div>
          ))}
        </div>
      )}

      <div
        className={cn(
          "overflow-x-auto rounded-lg border border-border bg-surface",
          renderMobileCard && "hidden md:block",
        )}
      >
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {columns.map((col) => {
                const sorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    aria-sort={
                      sorted ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
                    }
                    className={cn(
                      "px-4 py-3 text-xs font-medium text-fg-tertiary",
                      col.align === "end" ? "text-end" : "text-start",
                      col.hideBelow && HIDE_BELOW[col.hideBelow],
                    )}
                  >
                    {col.sortBy ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xs transition-colors hover:text-fg",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                          sorted && "text-fg",
                        )}
                      >
                        {col.header}
                        {sorted ? (
                          sort.dir === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown
                            className="size-3.5 opacity-40"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border-subtle last:border-0",
                  onRowClick && "cursor-pointer transition-colors hover:bg-surface-muted",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3.5 text-fg",
                      col.align === "end" ? "text-end tabular" : "text-start",
                      col.hideBelow && HIDE_BELOW[col.hideBelow],
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DataTableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-4 border-b border-border bg-surface-muted px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-border-subtle px-4 py-4 last:border-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn("h-3.5 flex-1", c === 0 && "max-w-40")} />
          ))}
        </div>
      ))}
    </div>
  );
}
