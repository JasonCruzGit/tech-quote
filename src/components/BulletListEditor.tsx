"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { PlusIcon } from "@/components/ui/Icons";
import { wrapMarkdownSelection } from "@/lib/richText";

interface BulletListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  compact?: boolean;
}

interface ContextMenuState {
  index: number;
  x: number;
  y: number;
  selectionStart: number;
  selectionEnd: number;
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
  compact,
  autoFocus,
  textareaRef,
  onContextMenu,
  onKeyDown,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
  textareaRef?: (el: HTMLTextAreaElement | null) => void;
  onContextMenu?: (e: ReactMouseEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  function setRefs(el: HTMLTextAreaElement | null) {
    localRef.current = el;
    textareaRef?.(el);
  }

  function resize() {
    const el = localRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }

  useLayoutEffect(() => {
    resize();
  }, [value]);

  useLayoutEffect(() => {
    if (!autoFocus) return;
    const el = localRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, [autoFocus]);

  return (
    <textarea
      ref={setRefs}
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      onInput={resize}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
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
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLTextAreaElement | null>>([]);

  useEffect(() => {
    if (focusIndex === null) return;
    const id = window.setTimeout(() => setFocusIndex(null), 0);
    return () => window.clearTimeout(id);
  }, [focusIndex, items.length]);

  useEffect(() => {
    if (!menu) return;

    function close() {
      setMenu(null);
    }

    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    function onPointer(e: PointerEvent) {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [menu]);

  function updateLine(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function removeLine(index: number) {
    onChange(items.filter((_, i) => i !== index));
    setMenu(null);
  }

  function addLine() {
    onChange([...items, ""]);
    setFocusIndex(items.length);
  }

  function insertLineAt(index: number) {
    const next = [...items];
    next.splice(index, 0, "");
    onChange(next);
    setFocusIndex(index);
    setMenu(null);
  }

  function applyFormat(
    index: number,
    marker: "**" | "*",
    selection?: { start: number; end: number }
  ) {
    const el = rowRefs.current[index];
    const value = items[index] ?? "";
    const start = selection?.start ?? el?.selectionStart ?? value.length;
    const end = selection?.end ?? el?.selectionEnd ?? value.length;
    const result = wrapMarkdownSelection(value, start, end, marker);
    updateLine(index, result.value);
    setMenu(null);
    requestAnimationFrame(() => {
      const target = rowRefs.current[index];
      if (!target) return;
      target.focus();
      target.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  function handleLineKeyDown(index: number, e: KeyboardEvent<HTMLTextAreaElement>) {
    const meta = e.metaKey || e.ctrlKey;
    if (!meta) return;
    if (e.key.toLowerCase() === "b") {
      e.preventDefault();
      applyFormat(index, "**");
    } else if (e.key.toLowerCase() === "i") {
      e.preventDefault();
      applyFormat(index, "*");
    }
  }

  function openContextMenu(index: number, e: ReactMouseEvent) {
    e.preventDefault();
    const el = rowRefs.current[index];
    setMenu({
      index,
      x: e.clientX,
      y: e.clientY,
      selectionStart: el?.selectionStart ?? 0,
      selectionEnd: el?.selectionEnd ?? 0,
    });
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
            No lines yet — right-click or use Add line
          </p>
        )}
        {items.map((line, i) => (
          <div
            key={i}
            className="group flex items-start gap-1.5"
            onContextMenu={(e) => openContextMenu(i, e)}
          >
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
              autoFocus={focusIndex === i}
              textareaRef={(el) => {
                rowRefs.current[i] = el;
              }}
              onContextMenu={(e) => openContextMenu(i, e)}
              onKeyDown={(e) => handleLineKeyDown(i, e)}
            />
            <div
              className={`flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 ${
                compact ? "mt-0.5" : "mt-1.5"
              }`}
            >
              <button
                type="button"
                onClick={() => applyFormat(i, "**")}
                className={`ui-icon-btn ${compact ? "!h-6 !w-6 text-[11px] font-bold" : "text-xs font-bold"}`}
                aria-label="Bold"
                title="Bold (⌘B)"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => applyFormat(i, "*")}
                className={`ui-icon-btn ${compact ? "!h-6 !w-6 text-[11px] italic" : "text-xs italic"}`}
                aria-label="Italic"
                title="Italic (⌘I)"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => removeLine(i)}
                className={`ui-icon-btn ui-icon-btn-danger ${compact ? "!h-6 !w-6" : ""}`}
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
          </div>
        ))}
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-2 ${compact ? "mt-1.5" : "mt-1"}`}>
        <button
          type="button"
          onClick={addLine}
          className={`inline-flex items-center gap-1 rounded-md text-xs font-semibold text-[var(--brand)] hover:bg-[var(--brand-tint)] ${
            compact ? "px-1 py-0.5" : "px-1.5 py-1"
          }`}
        >
          <PlusIcon size={12} />
          {addLabel}
        </button>
        <p className="text-[10px] text-[var(--ink-400)]">
          Right-click to insert · ⌘B / ⌘I to format
        </p>
      </div>

      {menu ? (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-50 min-w-[180px] rounded-lg border border-[var(--line)] bg-white py-1 shadow-lg"
          style={{
            left: Math.min(menu.x, window.innerWidth - 200),
            top: Math.min(menu.y, window.innerHeight - 220),
          }}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-1.5 text-left text-[13px] text-[var(--ink-800)] hover:bg-[var(--surface-sub)]"
            onClick={() => insertLineAt(menu.index)}
          >
            Insert line above
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-1.5 text-left text-[13px] text-[var(--ink-800)] hover:bg-[var(--surface-sub)]"
            onClick={() => insertLineAt(menu.index + 1)}
          >
            Insert line below
          </button>
          <div className="my-1 border-t border-[var(--line)]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-1.5 text-left text-[13px] text-[var(--ink-800)] hover:bg-[var(--surface-sub)]"
            onClick={() =>
              applyFormat(menu.index, "**", {
                start: menu.selectionStart,
                end: menu.selectionEnd,
              })
            }
          >
            Bold selection
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-1.5 text-left text-[13px] text-[var(--ink-800)] hover:bg-[var(--surface-sub)]"
            onClick={() =>
              applyFormat(menu.index, "*", {
                start: menu.selectionStart,
                end: menu.selectionEnd,
              })
            }
          >
            Italic selection
          </button>
          <div className="my-1 border-t border-[var(--line)]" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-1.5 text-left text-[13px] text-[#b42318] hover:bg-[#fef3f2]"
            onClick={() => removeLine(menu.index)}
          >
            Delete line
          </button>
        </div>
      ) : null}
    </div>
  );
}
