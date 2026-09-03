"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import RecordNotFound from "@/components/ui/RecordNotFound";
import SaveIndicator from "@/components/ui/SaveIndicator";
import SectionCard from "@/components/ui/SectionCard";
import { RfqStatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { daysUntil } from "@/lib/deadline";
import {
  convertRfqToQuote,
  deleteRfq,
  updateRfq,
  useRfq,
  useRfqsLoadState,
  useRfqsSavingStatus,
} from "@/lib/rfqStore";
import { PROCUREMENT_MODES, type RfqStatus } from "@/lib/types";

const STATUSES: RfqStatus[] = [
  "New",
  "Quoted",
  "Submitted",
  "Won",
  "Lost",
  "Cancelled",
];

export default function RfqEditorPage() {
  const params = useParams<{ id: string }>();
  const rfq = useRfq(params.id);
  const loadState = useRfqsLoadState();
  const isSaving = useRfqsSavingStatus();
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);

  if (!rfq) {
    return (
      <RecordNotFound
        isLoading={loadState === "loading" || loadState === "idle"}
        loadingLabel="Loading RFQ…"
        missingLabel="RFQ not found. It may have been deleted."
        backHref="/projects/rfq"
        backLabel="Back to RFQ"
      />
    );
  }

  const current = rfq;

  function patch(partial: Partial<typeof current>) {
    updateRfq(current.id, (c) => ({ ...c, ...partial }));
  }

  function handleDelete() {
    const label = current.rfqNumber.trim() || current.title.trim() || "this RFQ";
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteRfq(current.id);
      router.push("/projects/rfq");
    }
  }

  async function handleConvert() {
    setIsConverting(true);
    try {
      const { quote } = await convertRfqToQuote(current.id);
      router.push(`/quotes/${quote.id}`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to create the quotation. Please try again.");
    } finally {
      setIsConverting(false);
    }
  }

  const days = daysUntil(current.deadline);
  const isClosed =
    current.status === "Won" || current.status === "Lost" || current.status === "Cancelled";

  return (
    <AppShell>
      <main className="ui-page">
        <div className="ui-page-inner-narrow">
          <PageHeader
            eyebrow={current.rfqNumber.trim() ? `RFQ ${current.rfqNumber}` : "New RFQ"}
            title={current.title.trim() || "Untitled request"}
            actions={
              <>
                <SaveIndicator isSaving={isSaving} />
                <Link href="/projects/rfq" className="ui-btn ui-btn-ghost">
                  Back
                </Link>
                <button type="button" onClick={handleDelete} className="ui-btn ui-btn-danger">
                  Delete
                </button>
                {current.quoteId ? (
                  <Link href={`/quotes/${current.quoteId}`} className="ui-btn ui-btn-primary">
                    Open quotation
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="ui-btn ui-btn-primary"
                    title="Creates a draft quotation prefilled with this client's details"
                  >
                    {isConverting ? "Creating…" : "Create quotation"}
                  </button>
                )}
              </>
            }
          />

          {current.quoteNumber ? (
            <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--info-line)] bg-[var(--info-tint)] px-4 py-3 text-[13px] text-[var(--ink-700)]">
              <span className="font-semibold">Quotation {current.quoteNumber}</span>
              <span className="text-[var(--ink-500)]">was prepared for this RFQ.</span>
            </div>
          ) : null}

          {!isClosed && days !== null && days <= 3 ? (
            <div
              className={`mb-5 rounded-lg border px-4 py-3 text-[13px] font-medium ${
                days < 0
                  ? "border-[var(--danger-line)] bg-[var(--danger-tint)] text-[var(--danger)]"
                  : "border-[var(--warn-line)] bg-[var(--warn-tint)] text-[var(--warn)]"
              }`}
            >
              {days < 0
                ? `Submission deadline passed ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.`
                : days === 0
                  ? "Submission deadline is today."
                  : `Submission deadline in ${days} day${days === 1 ? "" : "s"}.`}
            </div>
          ) : null}

          <div className="space-y-4">
            <SectionCard
              title="Solicitation"
              description="Reference details exactly as they appear on the request received."
              headerRight={<RfqStatusBadge status={current.status} />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="ui-label">RFQ / reference number</label>
                  <input
                    value={current.rfqNumber}
                    onChange={(e) => patch({ rfqNumber: e.target.value })}
                    placeholder="e.g. RFQ-2026-0142"
                    className="ui-input ui-num"
                  />
                </div>
                <div>
                  <label className="ui-label">Mode of procurement</label>
                  <select
                    value={current.modeOfProcurement}
                    onChange={(e) =>
                      patch({
                        modeOfProcurement: e.target
                          .value as typeof current.modeOfProcurement,
                      })
                    }
                    className="ui-input"
                  >
                    {PROCUREMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="ui-label">Title / subject</label>
                <input
                  value={current.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="e.g. Supply and Delivery of Rescue Equipment"
                  className="ui-input"
                />
              </div>

              <div className="mt-5 max-w-[260px]">
                <label className="ui-label">Approved Budget for the Contract</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={Number.isFinite(current.abc) ? current.abc : 0}
                  onChange={(e) => patch({ abc: parseFloat(e.target.value) || 0 })}
                  className="ui-input ui-num"
                />
                {current.abc > 0 ? (
                  <p className="mt-1.5 text-xs text-[var(--ink-400)]">
                    {formatCurrency(current.abc)}
                  </p>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Requesting office"
              description="Who sent the request. These details prefill the quotation."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="ui-label">Contact person</label>
                  <input
                    value={current.clientName}
                    onChange={(e) => patch({ clientName: e.target.value })}
                    placeholder="Contact person"
                    className="ui-input"
                  />
                </div>
                <div>
                  <label className="ui-label">Office / agency</label>
                  <input
                    value={current.clientOffice}
                    onChange={(e) => patch({ clientOffice: e.target.value })}
                    placeholder="e.g. MDRRMO Rizal"
                    className="ui-input"
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="ui-label">Address</label>
                <input
                  value={current.clientAddress}
                  onChange={(e) => patch({ clientAddress: e.target.value })}
                  placeholder="Full address"
                  className="ui-input"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Schedule & status"
              description="Dates received and due, plus where this request currently stands."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="ui-label">Date received</label>
                  <input
                    type="date"
                    value={current.dateReceived}
                    onChange={(e) => patch({ dateReceived: e.target.value })}
                    className="ui-input"
                  />
                </div>
                <div>
                  <label className="ui-label">Submission deadline</label>
                  <input
                    type="date"
                    value={current.deadline}
                    onChange={(e) => patch({ deadline: e.target.value })}
                    className="ui-input"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="ui-label">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => patch({ status })}
                      aria-pressed={current.status === status}
                      className={`ui-chip ${current.status === status ? "ui-chip-active" : ""}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="ui-label">Notes</label>
                <textarea
                  value={current.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                  rows={3}
                  placeholder="Requirements, clarifications, or submission instructions"
                  className="ui-textarea min-h-[84px] resize-y"
                />
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
