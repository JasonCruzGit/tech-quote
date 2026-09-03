"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutIcon } from "@/components/ui/Icons";

interface NavLink {
  href: string;
  label: string;
  match: (path: string) => boolean;
  icon: ReactNode;
}

interface NavGroup {
  label: string;
  items: NavLink[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Projects",
    items: [
      {
        href: "/",
        label: "Quotations",
        match: (path) => path === "/" || path.startsWith("/quotes"),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M4 2.5h8A1.5 1.5 0 0113.5 4v9.5L11 11.5H4A1.5 1.5 0 012.5 10V4A1.5 1.5 0 014 2.5z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        href: "/projects/rfq",
        label: "RFQ",
        match: (path) => path.startsWith("/projects/rfq"),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3 4.5h10M3 8h6.5M3 11.5H8"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="M11.5 10.5L13.5 12.5M13.5 10.5L11.5 12.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        href: "/projects/bidding",
        label: "Bidding",
        match: (path) => path.startsWith("/projects/bidding"),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M4 12.5h8M6 12.5V9.5l-2-3h8l-2 3v3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M8 3.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        href: "/projects/status",
        label: "Monitoring/Status",
        match: (path) =>
          path.startsWith("/projects/status") ||
          path.startsWith("/projects/list") ||
          (path.startsWith("/projects/") &&
            !path.startsWith("/projects/rfq") &&
            !path.startsWith("/projects/bidding") &&
            !path.startsWith("/projects/documentation") &&
            !path.startsWith("/projects/purchases")),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M3 12.5V8.5M8 12.5V3.5M13 12.5v-6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        href: "/projects/documentation",
        label: "Documentation",
        match: (path) => path.startsWith("/projects/documentation"),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M4.5 2.5h5.2L12.5 5.3V13.5A1 1 0 0111.5 14.5H4.5A1 1 0 013.5 13.5v-11A1 1 0 014.5 2.5z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M9 2.8V5.5H11.7"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Procurement",
    items: [
      {
        href: "/projects/purchases",
        label: "Actual Purchase",
        match: (path) => path.startsWith("/projects/purchases"),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M2.5 3.5h1.8l1.4 6.8h6.3l1.2-4.8H5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="6.75" cy="12.75" r="0.9" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="11.5" cy="12.75" r="0.9" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/items",
        label: "List of Items",
        match: (path) => path.startsWith("/items"),
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M6 4h7M6 8h7M6 12h4.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="3.25" cy="4" r="0.85" fill="currentColor" />
            <circle cx="3.25" cy="8" r="0.85" fill="currentColor" />
            <circle cx="3.25" cy="12" r="0.85" fill="currentColor" />
          </svg>
        ),
      },
    ],
  },
];

export default function SideNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  function handleLogout() {
    if (!window.confirm("Log out of the quotation system?")) return;
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="ui-nav no-print sticky top-0 flex h-screen w-[238px] shrink-0 flex-col">
      <div className="flex items-center gap-2.5 border-b border-[var(--nav-line)] px-5 py-4">
        <Image
          src="/brand/techcentrix-logo.png"
          alt="Techcentrix Inc."
          width={34}
          height={34}
          className="h-[34px] w-[34px] rounded-md bg-black object-cover ring-1 ring-white/10"
          priority
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold tracking-tight text-white">
            Techcentrix Inc.
          </p>
          <p className="truncate text-[10px] font-medium tracking-[0.08em] text-[var(--nav-label)] uppercase">
            Quotation System
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="ui-nav-label mb-2">{group.label}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`ui-nav-item ${active ? "ui-nav-item-active" : ""}`}
                  >
                    <span className="ui-nav-icon">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--nav-line)] px-3 py-3.5">
        <button type="button" onClick={handleLogout} className="ui-nav-item w-full">
          <span className="ui-nav-icon">
            <LogoutIcon size={16} />
          </span>
          <span className="truncate">Logout</span>
        </button>
        <p className="mt-2 px-3 text-[10px] text-[#565e69]">
          © {new Date().getFullYear()} Techcentrix Inc.
        </p>
      </div>
    </aside>
  );
}
