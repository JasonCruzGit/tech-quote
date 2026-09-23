import type { InclusionLine } from "@/lib/types";

/** Normalize legacy string[] inclusions and partial objects into InclusionLine[]. */
export function normalizeInclusions(raw: unknown): InclusionLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (typeof entry === "string") {
      return { label: entry, cost: 0 };
    }
    if (entry && typeof entry === "object") {
      const obj = entry as { label?: unknown; text?: unknown; cost?: unknown };
      const label = String(obj.label ?? obj.text ?? "").trim();
      const cost = typeof obj.cost === "number" && Number.isFinite(obj.cost) ? obj.cost : 0;
      return { label, cost };
    }
    return { label: "", cost: 0 };
  });
}

export function inclusionLabels(inclusions: InclusionLine[]): string[] {
  return inclusions.map((inc) => inc.label);
}

export function inclusionsCostTotal(inclusions: InclusionLine[]): number {
  return inclusions.reduce((sum, inc) => sum + (Number(inc.cost) || 0), 0);
}

export function splitInclusionLines(value: string): InclusionLine[] {
  return value
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label, cost: 0 }));
}

/**
 * Keep costs attached when the bullet-list editor updates labels
 * (same length = edit; +1 = insert; -1 = delete).
 */
export function reconcileInclusionLabels(
  prev: InclusionLine[],
  labels: string[]
): InclusionLine[] {
  if (labels.length === prev.length) {
    return labels.map((label, i) => ({ label, cost: prev[i]?.cost ?? 0 }));
  }

  if (labels.length === prev.length + 1) {
    for (let i = 0; i < labels.length; i++) {
      if (i === prev.length || labels[i] !== prev[i].label) {
        return [
          ...prev.slice(0, i).map((p, j) => ({ label: labels[j], cost: p.cost })),
          { label: labels[i], cost: 0 },
          ...prev.slice(i).map((p, j) => ({
            label: labels[i + 1 + j],
            cost: p.cost,
          })),
        ];
      }
    }
  }

  if (labels.length === prev.length - 1) {
    for (let i = 0; i < prev.length; i++) {
      if (i === labels.length || labels[i] !== prev[i].label) {
        return labels.map((label, j) => {
          const src = j < i ? prev[j] : prev[j + 1];
          return { label, cost: src?.cost ?? 0 };
        });
      }
    }
  }

  return labels.map((label, i) => ({ label, cost: prev[i]?.cost ?? 0 }));
}

export function plainInclusionLabel(label: string): string {
  return label.replace(/\*\*/g, "").replace(/\*/g, "").trim();
}
