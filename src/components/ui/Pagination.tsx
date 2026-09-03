"use client";

import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

/** Page numbers around the current page, with -1 marking an ellipsis gap. */
function pageWindow(pageCount: number, currentPage: number): number[] {
  const visible = Array.from({ length: pageCount }, (_, i) => i + 1).filter((n) => {
    if (pageCount <= 7) return true;
    return n === 1 || n === pageCount || Math.abs(n - currentPage) <= 1;
  });

  return visible.reduce<number[]>((acc, n, idx, arr) => {
    if (idx > 0 && n - arr[idx - 1] > 1) acc.push(-1);
    acc.push(n);
    return acc;
  }, []);
}

export default function Pagination({
  rangeStart,
  rangeEnd,
  total,
  pageCount,
  currentPage,
  onPageChange,
  meta,
}: {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  meta?: ReactNode;
}) {
  return (
    <div className="ui-card-foot">
      <p className="text-xs text-[var(--ink-500)]">
        Showing{" "}
        <span className="ui-num font-semibold text-[var(--ink-900)]">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of <span className="ui-num font-semibold text-[var(--ink-900)]">{total}</span>
        {meta}
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="ui-icon-btn ui-icon-btn-bare"
            aria-label="Previous page"
          >
            <ChevronLeftIcon size={14} />
          </button>

          {pageWindow(pageCount, currentPage).map((n, idx) =>
            n === -1 ? (
              <span key={`gap-${idx}`} className="px-1 text-xs text-[var(--ink-300)]">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange(n)}
                aria-current={n === currentPage ? "page" : undefined}
                className={`ui-num flex h-[1.875rem] min-w-[1.875rem] items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors ${
                  n === currentPage
                    ? "bg-[var(--brand)] text-white"
                    : "text-[var(--ink-600)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {n}
              </button>
            )
          )}

          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
            className="ui-icon-btn ui-icon-btn-bare"
            aria-label="Next page"
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
