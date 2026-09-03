"use client";

import { useLayoutEffect, useRef } from "react";
import { PlusIcon } from "@/components/ui/Icons";

interface BulletListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  compact?: boolean;
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
  compact,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }

  useLayoutEffect(() => {
    resize();
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      placeholder={placeholder}
      className={
        compact
          ? "min-w-0 flex-1 resize-none border-0 bg-transparent px-0 py-1 text-sm leading-snug text-[var(--ink-800)] placeholder:text-[var(--ink-300)] focus:outline-none"
          : "ui-textarea min-w-0 flex-1"
      }
    />
  );
}

export default function BulletListEditor({
  items,
  onChange,
  placeholder = "Add a line...",
  addLabel = "Add line",
  compact = false,
}: BulletListEditorProps) {
  function updateLine(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function removeLine(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addLine() {
    onChange([...items, ""]);
  }

  const panelClass = compact
    ? "rounded-md border border-[var(--line)] bg-[var(--surface-sub)] px-2.5 py-2"
    : "";

  return (
    <div className={panelClass}>
      <div className={compact ? "space-y-0.5" : "space-y-2"}>
        {items.length === 0 && (
          <p
            className={
              compact
                ? "py-1.5 text-xs text-[var(--ink-400)]"
                : "rounded-md border border-dashed border-[var(--line-strong)] bg-[var(--surface-sub)] px-3 py-3 text-xs text-[var(--ink-400)]"
            }
          >
            No lines yet
          </p>
        )}
        {items.map((line, i) => (
          <div key={i} className="group flex items-start gap-1.5">
            <span
              className={
                compact
                  ? "mt-2 w-2 shrink-0 text-[9px] leading-none text-[var(--ink-300)]"
                  : "mt-2.5 w-3 shrink-0 text-center text-[10px] text-[var(--ink-300)]"
              }
            >
              ●
            </span>
            <AutoTextarea
              value={line}
              onChange={(value) => updateLine(i, value)}
              placeholder={placeholder}
              compact={compact}
            />
            <button
              type="button"
              onClick={() => removeLine(i)}
              className={`ui-icon-btn ui-icon-btn-danger shrink-0 opacity-0 group-hover:opacity-100 ${
                compact ? "mt-0.5 !h-6 !w-6" : "mt-1.5"
              }`}
              aria-label="Remove line"
              title="Remove line"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path
                  d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addLine}
        className={`inline-flex items-center gap-1 rounded-md text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand-tint)] ${
          compact ? "mt-1.5 px-1 py-0.5" : "mt-0 px-1.5 py-1"
        }`}
      >
        <PlusIcon size={12} />
        {addLabel}
      </button>
    </div>
  );
}
