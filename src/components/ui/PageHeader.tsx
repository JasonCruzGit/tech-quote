import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Small uppercase label above the title */
  eyebrow?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <p className="ui-eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="ui-title truncate">{title}</h1>
        {subtitle ? <p className="ui-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
