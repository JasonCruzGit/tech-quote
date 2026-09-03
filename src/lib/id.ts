export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Quote numbers follow the `Q_MMDDYY###` scheme used by the source template,
 * e.g. `Q_0713001` for the 1st quote created on Jul 13 (of the current year).
 */
export function generateQuoteNumber(existing: string[], date = new Date()): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const prefix = `Q_${mm}${dd}`;

  const usedSeqs = existing
    .filter((q) => q.startsWith(prefix))
    .map((q) => parseInt(q.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));

  const nextSeq = (usedSeqs.length ? Math.max(...usedSeqs) : 0) + 1;
  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}
