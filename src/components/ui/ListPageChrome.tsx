import type { ReactNode } from "react";

interface ListPageChromeProps {
  title: string;
  description: string;
  toolbar?: ReactNode;
  /** Metric strip rendered above the table card */
  stats?: ReactNode;
  /** Filter chips rendered between the stats and the card */
  filters?: ReactNode;
  /** Right side of the card header, e.g. a record count */
  cardMeta?: ReactNode;
  children: ReactNode;
}

/**
 * Standard list layout: page heading + actions, optional metrics and filters,
 * then a single card holding the table and its footer.
 */
export default function ListPageChrome({
  title,
  description,
  toolbar,
  stats,
  filters,
  cardMeta,
  children,
}: ListPageChromeProps) {
  return (
    <main className="ui-page">
      <div className="ui-page-inner">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="ui-title">{title}</h1>
            <p className="ui-subtitle">{description}</p>
          </div>
          {toolbar ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div>
          ) : null}
        </div>

        {stats}
        {filters}

        <section className="ui-card">
          {cardMeta ? (
            <div className="ui-card-head">
              <h2 className="ui-card-title">{title}</h2>
              {cardMeta}
            </div>
          ) : null}
          {children}
        </section>
      </div>
    </main>
  );
}
