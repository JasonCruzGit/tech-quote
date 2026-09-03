"use client";

import { useCallback, useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export interface SortState<K extends string> {
  key: K;
  dir: SortDir;
}

/** Value kinds a column can sort on. Nullish always sorts last. */
export type SortValue = string | number | null | undefined;

function compare(a: SortValue, b: SortValue): number {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Column sorting for list tables. Clicking the active column flips direction;
 * clicking a new column starts ascending.
 */
export function useTableSort<T, K extends string>(
  rows: T[],
  getValue: (row: T, key: K) => SortValue,
  initial: SortState<K>
) {
  const [sort, setSort] = useState<SortState<K>>(initial);

  const toggle = useCallback((key: K) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }, []);

  const sorted = useMemo(() => {
    const factor = sort.dir === "asc" ? 1 : -1;
    // Nullish values stay pinned to the bottom regardless of direction.
    return [...rows].sort((a, b) => {
      const av = getValue(a, sort.key);
      const bv = getValue(b, sort.key);
      const aEmpty = av === null || av === undefined || av === "";
      const bEmpty = bv === null || bv === undefined || bv === "";
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
      return compare(av, bv) * factor;
    });
    // getValue is defined inline by callers, so exclude it from the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);

  return { sorted, sort, toggle };
}
