import type { CSSProperties } from "react";

/** Clamp a progress value to 0–100. */
export function clampProgressPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Light slate → brand fill aligned with the #2C3947 palette.
 * The gradient spans the full track width so the fill edge matches the
 * percentage, without traffic-light red/amber/green shifts.
 */
export function progressFillStyle(pct: number): CSSProperties {
  const value = clampProgressPct(pct);
  if (value <= 0) {
    return { width: "0%" };
  }
  return {
    width: `${value}%`,
    backgroundImage:
      "linear-gradient(90deg, var(--progress-fill-start) 0%, var(--progress-fill-end) 100%)",
    backgroundSize: `${(100 / value) * 100}% 100%`,
    backgroundRepeat: "no-repeat",
  };
}

/** Label color for progress percentage text and range accents. */
export function progressColor(pct: number): string {
  const value = clampProgressPct(pct);
  if (value >= 100) return "var(--progress-label-complete)";
  if (value >= 60) return "var(--progress-label-high)";
  if (value >= 25) return "var(--progress-label-mid)";
  return "var(--progress-label-low)";
}
