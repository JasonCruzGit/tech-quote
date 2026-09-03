import type { ReactNode } from "react";
import { InboxIcon } from "./Icons";

export default function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-sub)] text-[var(--ink-400)]">
        {icon ?? <InboxIcon size={18} />}
      </span>
      <p className="text-sm font-semibold text-[var(--ink-800)]">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--ink-500)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
