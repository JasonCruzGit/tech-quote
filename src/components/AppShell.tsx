"use client";

import SideNav from "@/components/SideNav";
import TopBar from "@/components/TopBar";

interface AppShellProps {
  children: React.ReactNode;
  /** Hide the sidebar (e.g. print view) */
  hideNav?: boolean;
}

export default function AppShell({ children, hideNav = false }: AppShellProps) {
  if (hideNav) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
      <SideNav />
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
