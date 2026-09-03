/** Whole days from today until an ISO date; negative when past. Null if unset. */
export function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const target = new Date(`${iso}T00:00:00`);
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

export type DeadlineTone = "neutral" | "warn" | "danger";

/** Overdue reads as danger, within three days as a warning. */
export function deadlineTone(days: number | null): DeadlineTone {
  if (days === null) return "neutral";
  if (days < 0) return "danger";
  if (days <= 3) return "warn";
  return "neutral";
}
