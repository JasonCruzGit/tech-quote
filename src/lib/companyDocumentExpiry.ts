import type { CompanyDocument, CompanyDocumentExpiryStatus } from "@/lib/types";

/** Days before expiry that count as a soft warning. */
export const EXPIRY_WARNING_DAYS = 30;
/** Days before expiry that count as critical. */
export const EXPIRY_CRITICAL_DAYS = 7;

function todayIsoDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function parseIsoDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function daysUntilExpiry(expiresOn: string, now = new Date()): number | null {
  const expiry = parseIsoDate(expiresOn);
  if (!expiry) return null;
  const start = new Date(`${todayIsoDate(now)}T12:00:00`);
  return Math.round((expiry.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

export function companyDocumentExpiryStatus(
  expiresOn: string,
  now = new Date()
): CompanyDocumentExpiryStatus {
  const days = daysUntilExpiry(expiresOn, now);
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= EXPIRY_CRITICAL_DAYS) return "critical";
  if (days <= EXPIRY_WARNING_DAYS) return "warning";
  return "ok";
}

export function companyDocumentExpiryLabel(
  status: CompanyDocumentExpiryStatus,
  days: number | null
): string {
  switch (status) {
    case "expired":
      return days === null
        ? "Expired"
        : `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
    case "critical":
      return days === 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"}`;
    case "warning":
      return `Expires in ${days} days`;
    case "ok":
      return days === null ? "Valid" : `Valid · ${days} days left`;
    default:
      return "No expiry";
  }
}

export function summarizeCompanyDocumentAlerts(docs: CompanyDocument[]) {
  let expired = 0;
  let critical = 0;
  let warning = 0;
  for (const doc of docs) {
    const status = companyDocumentExpiryStatus(doc.expiresOn);
    if (status === "expired") expired += 1;
    else if (status === "critical") critical += 1;
    else if (status === "warning") warning += 1;
  }
  return { expired, critical, warning, total: expired + critical + warning };
}
