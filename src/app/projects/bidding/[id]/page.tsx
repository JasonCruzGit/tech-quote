"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import RecordNotFound from "@/components/ui/RecordNotFound";
import SaveIndicator from "@/components/ui/SaveIndicator";
import SectionCard from "@/components/ui/SectionCard";
import { BidStatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  awardBid,
  deleteBid,
  updateBid,
  useBid,
  useBidsLoadState,
  useBidsSavingStatus,
} from "@/lib/bidsStore";
import { upsertProjectInCache } from "@/lib/projectsStore";
import type { BidStatus } from "@/lib/types";

const STATUSES: BidStatus[] = [
  "Preparing",
  "Submitted",
  "Opened",
  "Won",
  "Lost",
  "Cancelled",
];

export default function BidEditorPage() {
  const params = useParams<{ id: string }>();
  const bid = useBid(params.id);
  const loadState = useBidsLoadState();
  const isSaving = useBidsSavingStatus();
  const router = useRouter();
  const [isAwarding, setIsAwarding] = useState(false);

  if (!bid) {
    return (
      <RecordNotFound
        isLoading={loadState === "loading" || loadState === "idle"}
        loadingLabel="Loading bid…"
        missingLabel="Bid not found. It may have been deleted."
        backHref="/projects/bidding"
        backLabel="Back to Bidding"
      />
    );
  }

  const current = bid;

  function patch(partial: Partial<typeof current>) {
    updateBid(current.id, (c) => ({ ...c, ...partial }));
  }

  function handleDelete() {
    const label =
      current.referenceNumber.trim() || current.title.trim() || "this bid";
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteBid(current.id);
      router.push("/projects/bidding");
    }
  }

  async function handleAward() {
    if (
      !window.confirm(
        "Mark this bid as won? This opens a delivery project and creates its document checklist."
      )
    ) {
      return;
    }
    setIsAwarding(true);
    try {
      const { project } = await awardBid(current.id);
      upsertProjectInCache(project);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to award this bid. Please try again.");
    } finally {
      setIsAwarding(false);
    }
  }

  const belowAbc =
    current.abc > 0 && current.bidAmount > 0
      ? (current.abc - current.bidAmount) / current.abc
      : null;
  const overAbc = belowAbc !== null && belowAbc < 0;
  const bondPct =
    current.abc > 0 && current.bidBondAmount > 0
      ? current.bidBondAmount / current.abc
      : null;

  return (
    <AppShell>
      <main className="ui-page">
        <div className="ui-page-inner-narrow">
          <PageHeader
            eyebrow={
              current.referenceNumber.trim()
                ? `Bid ${current.referenceNumber}`
                : "New bid"
            }
            title={current.title.trim() || "Untitled bid"}
            actions={
              <>
                <SaveIndicator isSaving={isSaving} />
                <Link href="/projects/bidding" className="ui-btn ui-btn-ghost">
                  Back
                </Link>
                <button type="button" onClick={handleDelete} className="ui-btn ui-btn-danger">
                  Delete
                </button>
                {current.projectId ? (
                  <Link
                    href={`/projects/${current.projectId}`}
                    className="ui-btn ui-btn-primary"
                  >
                    Open project
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleAward}
                    disabled={isAwarding}
                    className="ui-btn ui-btn-ok"
                    title="Marks the bid as won, opens a project, and seeds its document checklist"
                  >
                    {isAwarding ? "Awarding…" : "Mark as Won"}
                  </button>
                )}
              </>
            }
          />

          {overAbc ? (
            <div className="mb-5 rounded-lg border border-[var(--danger-line)] bg-[var(--danger-tint)] px-4 py-3 text-[13px] font-medium text-[var(--danger)]">
              Our bid exceeds the approved budget by{" "}
              {formatCurrency(current.bidAmount - current.abc)}. Bids above the ABC are
              normally disqualified.
            </div>
          ) : null}

          <div className="space-y-4">
            <SectionCard
              title="Opportunity"
              description="Invitation to Bid reference and the procuring office."
              headerRight={<BidStatusBadge status={current.status} />}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="ui-label">Reference number</label>
                  <input
                    value={current.referenceNumber}
                    onChange={(e) => patch({ referenceNumber: e.target.value })}
                    placeholder="e.g. ITB-2026-018"
                    className="ui-input ui-num"
                  />
                </div>
                <div>
                  <label className="ui-label">Procuring office</label>
                  <input
                    value={current.clientOffice}
                    onChange={(e) => patch({ clientOffice: e.target.value })}
                    placeholder="e.g. Provincial Government of Palawan"
                    className="ui-input"
                  />
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
            </SectionCard>

            <SectionCard
              title="Bid figures"
              description="Approved budget, our offer, and the bid security posted."
              headerRight={
                belowAbc !== null ? (
                  <span
                    className={`ui-badge ${belowAbc >= 0 ? "ui-badge-ok" : "ui-badge-danger"}`}
                  >
                    {formatPercent(Math.abs(belowAbc))} {belowAbc >= 0 ? "below" : "over"} ABC
                  </span>
                ) : undefined
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="ui-label">Approved Budget for the Contract</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={Number.isFinite(current.abc) ? current.abc : 0}
                    onChange={(e) => patch({ abc: parseFloat(e.target.value) || 0 })}
                    className="ui-input ui-num"
                  />
                </div>
                <div>
                  <label className="ui-label">Our bid amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={Number.isFinite(current.bidAmount) ? current.bidAmount : 0}
                    onChange={(e) => patch({ bidAmount: parseFloat(e.target.value) || 0 })}
                    className="ui-input ui-num !font-semibold"
                  />
                </div>
                <div>
                  <label className="ui-label">Bid bond / security</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={Number.isFinite(current.bidBondAmount) ? current.bidBondAmount : 0}
                    onChange={(e) =>
                      patch({ bidBondAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="ui-input ui-num"
                  />
                  {bondPct !== null ? (
                    <p className="mt-1.5 text-xs text-[var(--ink-400)]">
                      {formatPercent(bondPct)} of ABC
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="ui-label">Bid bond status</label>
                  <label className="flex h-9 cursor-pointer items-center gap-2 text-[13px] text-[var(--ink-700)]">
                    <input
                      type="checkbox"
                      checked={current.bidBondPosted}
                      onChange={(e) => patch({ bidBondPosted: e.target.checked })}
                      className="ui-checkbox"
                    />
                    Bid bond has been posted
                  </label>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Schedule & outcome"
              description="Key bidding dates and the result once bids are opened."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="ui-label">Pre-bid conference</label>
                  <input
                    type="date"
                    value={current.preBidDate}
                    onChange={(e) => patch({ preBidDate: e.target.value })}
                    className="ui-input"
                  />
                </div>
                <div>
                  <label className="ui-label">Bid opening</label>
                  <input
                    type="date"
                    value={current.openingDate}
                    onChange={(e) => patch({ openingDate: e.target.value })}
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

              {current.status === "Lost" ? (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="ui-label">Awarded to</label>
                    <input
                      value={current.awardedTo}
                      onChange={(e) => patch({ awardedTo: e.target.value })}
                      placeholder="Winning bidder"
                      className="ui-input"
                    />
                  </div>
                  <div>
                    <label className="ui-label">Winning amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={Number.isFinite(current.awardAmount) ? current.awardAmount : 0}
                      onChange={(e) =>
                        patch({ awardAmount: parseFloat(e.target.value) || 0 })
                      }
                      className="ui-input ui-num"
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-5">
                <label className="ui-label">Notes</label>
                <textarea
                  value={current.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                  rows={3}
                  placeholder="Eligibility requirements, clarifications, or post-qualification notes"
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
