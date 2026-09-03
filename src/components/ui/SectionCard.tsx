"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "./Icons";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** When true, body starts collapsed and the header toggles open/closed */
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  headerRight?: ReactNode;
  /** Removes body padding, e.g. for a full-bleed table */
  flush?: boolean;
}

export default function SectionCard({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  className = "",
  headerRight,
  flush = false,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`ui-card ${className}`}>
      <div
        className={`ui-card-head !items-start ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((v) => !v);
                }
              }
            : undefined
        }
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? open : undefined}
      >
        <div className="min-w-0">
          <h2 className="ui-card-title">{title}</h2>
          {description ? <p className="ui-card-desc">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {headerRight}
          {collapsible ? (
            <ChevronDownIcon
              size={16}
              className={`text-[var(--ink-400)] transition-transform ${open ? "rotate-180" : ""}`}
            />
          ) : null}
        </div>
      </div>
      {(!collapsible || open) && (
        <div className={flush ? "" : "ui-card-body"}>{children}</div>
      )}
    </section>
  );
}
