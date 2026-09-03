"use client";

import { useRef, type ReactNode } from "react";
import { DownloadIcon, FilterIcon, PlusIcon, SearchIcon, UploadIcon } from "./Icons";

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="ui-search">
      <SearchIcon size={14} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}

export function FilterButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`ui-btn ${active ? "ui-btn-ghost ui-btn-ghost-active" : "ui-btn-ghost"}`}
    >
      <FilterIcon size={13} />
      Filters
    </button>
  );
}

export function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ui-btn ui-btn-ghost">
      <DownloadIcon size={13} />
      Export CSV
    </button>
  );
}

export function ImportButton({
  onFile,
  disabled,
  busyLabel = "Importing…",
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  busyLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="ui-btn ui-btn-ghost"
      >
        <UploadIcon size={13} />
        {disabled ? busyLabel : "Import Excel"}
      </button>
    </>
  );
}

export function CreateButton({
  onClick,
  disabled,
  label,
  busyLabel = "Creating…",
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  busyLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="ui-btn ui-btn-primary"
    >
      <PlusIcon size={13} />
      {disabled ? busyLabel : label}
    </button>
  );
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  counts,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`ui-chip ${active ? "ui-chip-active" : ""}`}
          >
            {option}
            {counts ? <span className="ui-chip-count">{counts[option] ?? 0}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}
