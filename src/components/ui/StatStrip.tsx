export interface Stat {
  label: string;
  value: string;
  hint?: string;
}

export default function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="ui-stats">
      {stats.map((stat) => (
        <article key={stat.label} className="ui-stat">
          <div className="ui-stat-body">
            <span className="ui-stat-label">{stat.label}</span>
            <p className="ui-stat-value">{stat.value}</p>
          </div>
          {stat.hint ? <p className="ui-stat-hint">{stat.hint}</p> : null}
        </article>
      ))}
    </div>
  );
}
