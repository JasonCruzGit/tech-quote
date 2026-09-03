"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ProjectStatusBadge } from "./StatusBadge";
import type { ProjectStatus } from "@/lib/types";

const STATUSES: ProjectStatus[] = ["Planning", "Ongoing", "On Hold", "Completed"];

const MENU_WIDTH = 168;
const GAP = 4;

export default function ProjectStatusPicker({
  status,
  onChange,
  label,
}: {
  status: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const position = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const height = menuRef.current?.offsetHeight ?? 0;
    const below = rect.bottom + GAP;
    const top =
      height > 0 && below + height > window.innerHeight - 8
        ? Math.max(8, rect.top - GAP - height)
        : below;
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - MENU_WIDTH - 8
    );
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (open) position();
  }, [open, position]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onScroll() {
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", position);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", position);
    };
  }, [open, position]);

  function select(next: ProjectStatus) {
    setOpen(false);
    if (next !== status) onChange(next);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="ui-status-picker"
        aria-label={label ?? `Change status, currently ${status}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change status"
        onClick={() => setOpen((v) => !v)}
      >
        <ProjectStatusBadge status={status} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="ui-menu"
            role="listbox"
            aria-label="Project status"
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
          >
            {STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === status}
                className={`ui-menu-item ${option === status ? "ui-menu-item-active" : ""}`}
                onClick={() => select(option)}
              >
                {option}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
