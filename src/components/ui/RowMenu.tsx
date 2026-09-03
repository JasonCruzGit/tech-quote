"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DotsIcon } from "./Icons";

export interface RowMenuAction {
  key: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Draws a divider above this action */
  separated?: boolean;
}

const MENU_WIDTH = 176;
const GAP = 4;

export default function RowMenu({ actions }: { actions: RowMenuAction[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const position = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const height = menuRef.current?.offsetHeight ?? 0;
    // Flip above the trigger when there is not enough room below.
    const below = rect.bottom + GAP;
    const top =
      height > 0 && below + height > window.innerHeight - 8
        ? Math.max(8, rect.top - GAP - height)
        : below;
    const left = Math.min(
      Math.max(8, rect.right - MENU_WIDTH),
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
    // Any scroll moves the trigger out from under the menu, so just dismiss.
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

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`ui-icon-btn ui-icon-btn-bare ${open ? "ui-icon-btn-open" : ""}`}
      >
        <DotsIcon size={14} />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="ui-menu"
            role="menu"
            style={{ top: coords.top, left: coords.left, width: MENU_WIDTH }}
          >
            {actions.map((action) => {
              const className = `ui-menu-item ${action.danger ? "ui-menu-item-danger" : ""}`;
              return (
                <div key={action.key}>
                  {action.separated ? <div className="ui-menu-sep" /> : null}
                  {action.href ? (
                    <Link
                      href={action.href}
                      className={className}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={action.disabled}
                      className={`${className} disabled:opacity-50`}
                      onClick={() => {
                        setOpen(false);
                        action.onSelect?.();
                      }}
                    >
                      {action.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
