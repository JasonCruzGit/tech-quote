"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Crumb {
  label: string;
  href?: string;
}

function breadcrumbs(pathname: string): Crumb[] {
  if (pathname.startsWith("/projects/rfq/")) {
    return [
      { label: "Projects", href: "/" },
      { label: "RFQ", href: "/projects/rfq" },
      { label: "Edit RFQ" },
    ];
  }
  if (pathname.startsWith("/projects/rfq")) {
    return [{ label: "Projects", href: "/" }, { label: "RFQ" }];
  }
  if (pathname.startsWith("/projects/bidding/")) {
    return [
      { label: "Projects", href: "/" },
      { label: "Bidding", href: "/projects/bidding" },
      { label: "Edit bid" },
    ];
  }
  if (pathname.startsWith("/projects/bidding")) {
    return [{ label: "Projects", href: "/" }, { label: "Bidding" }];
  }
  if (pathname.startsWith("/projects/documentation/")) {
    return [
      { label: "Projects", href: "/" },
      { label: "Documentation", href: "/projects/documentation" },
      { label: "Project checklist" },
    ];
  }
  if (pathname.startsWith("/projects/documentation")) {
    return [{ label: "Projects", href: "/" }, { label: "Documentation" }];
  }
  if (pathname.startsWith("/projects/purchases")) {
    return [
      { label: "Projects", href: "/" },
      { label: "Monitoring/Status", href: "/projects/status" },
      { label: "Actual Purchase" },
    ];
  }
  if (pathname.startsWith("/projects/status")) {
    return [{ label: "Projects", href: "/" }, { label: "Monitoring/Status" }];
  }
  if (pathname === "/projects" || pathname.startsWith("/projects/list")) {
    return [
      { label: "Projects", href: "/" },
      { label: "Monitoring/Status", href: "/projects/status" },
      { label: "List of projects" },
    ];
  }
  if (pathname.startsWith("/projects/")) {
    return [
      { label: "Projects", href: "/" },
      { label: "Monitoring/Status", href: "/projects/status" },
      { label: "Edit project" },
    ];
  }
  if (pathname.startsWith("/items/") && pathname !== "/items") {
    return [
      { label: "Catalog", href: "/items" },
      { label: "List of Items", href: "/items" },
      { label: "Edit item" },
    ];
  }
  if (pathname.startsWith("/items")) {
    return [{ label: "Catalog", href: "/items" }, { label: "List of Items" }];
  }
  if (pathname.startsWith("/quotes/") && pathname.endsWith("/print")) {
    return [{ label: "Quotations", href: "/" }, { label: "Print preview" }];
  }
  if (pathname.startsWith("/quotes/")) {
    return [{ label: "Quotations", href: "/" }, { label: "Edit quotation" }];
  }
  return [{ label: "Projects", href: "/" }, { label: "Quotations" }];
}

function formatHeaderDate(d = new Date()) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TopBar() {
  const pathname = usePathname() || "/";
  const crumbs = breadcrumbs(pathname);

  return (
    <header className="no-print flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-5 md:px-8">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 ? (
                <span aria-hidden className="text-[var(--ink-300)]">
                  /
                </span>
              ) : null}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="truncate text-[var(--ink-500)] transition-colors hover:text-[var(--brand)]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={
                    isLast
                      ? "truncate font-semibold text-[var(--ink-900)]"
                      : "truncate text-[var(--ink-500)]"
                  }
                >
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-4">
        <span className="ui-num hidden text-xs text-[var(--ink-400)] lg:inline">
          {formatHeaderDate()}
        </span>
        <div className="flex items-center gap-2.5 border-l border-[var(--line)] pl-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">
            AD
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-semibold text-[var(--ink-900)]">Administrator</p>
            <p className="text-[10px] text-[var(--ink-400)]">Techcentrix Inc.</p>
          </div>
        </div>
      </div>
    </header>
  );
}
