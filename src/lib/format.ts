const currencyFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number, withSymbol = true): string {
  if (!isFinite(value)) return "—";
  const formatted = currencyFormatter.format(Math.abs(value) < 1e-9 ? 0 : value);
  return withSymbol ? `₱${formatted}` : formatted;
}

export function formatPercent(value: number): string {
  if (!isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDateLong(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "2-digit" });
}

export function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
