"use client";

import { SortIcon } from "./Icons";
import type { SortState } from "@/lib/useTableSort";

export default function SortableTh<K extends string>({
  columnKey,
  label,
  sort,
  onSort,
  align = "left",
  className = "",
}: {
  columnKey: K;
  label: string;
  sort: SortState<K>;
  onSort: (key: K) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort.key === columnKey;
  return (
    <th
      className={className}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={`ui-th-sort ${active ? "ui-th-sort-active" : ""} ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        {label}
        <SortIcon className="ui-sort-icon" direction={active ? sort.dir : undefined} />
      </button>
    </th>
  );
}
