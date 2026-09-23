"use client";

import { plainInclusionLabel } from "@/lib/inclusions";
import type { InclusionLine } from "@/lib/types";

interface InclusionCostLinesProps {
  inclusions: InclusionLine[];
  onChangeCost: (index: number, cost: number) => void;
  compact?: boolean;
}

export default function InclusionCostLines({
  inclusions,
  onChangeCost,
  compact = false,
}: InclusionCostLinesProps) {
  if (inclusions.length === 0) return null;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <p className="text-[10px] font-semibold tracking-wide text-[var(--ink-400)] uppercase">
        Inclusion costs
      </p>
      <div className={compact ? "space-y-1" : "space-y-1.5"}>
        {inclusions.map((inc, i) => {
          const label = plainInclusionLabel(inc.label) || `Inclusion ${i + 1}`;
          return (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-2"
            >
              <p
                className="truncate text-xs text-[var(--ink-700)]"
                title={label}
              >
                {label}
              </p>
              <input
                type="number"
                step="0.01"
                value={Number.isFinite(inc.cost) ? inc.cost : 0}
                onChange={(e) =>
                  onChangeCost(i, parseFloat(e.target.value) || 0)
                }
                className="ui-input ui-input-compact tabular-nums"
                aria-label={`Cost for ${label}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
