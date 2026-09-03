"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import ListPageChrome from "@/components/ui/ListPageChrome";
import Pagination from "@/components/ui/Pagination";
import RowMenu from "@/components/ui/RowMenu";
import SortableTh from "@/components/ui/SortableTh";
import StatStrip, { type Stat } from "@/components/ui/StatStrip";
import { ExternalLinkIcon, PencilIcon } from "@/components/ui/Icons";
import { BidStatusBadge } from "@/components/ui/StatusBadge";
import {
  CreateButton,
  ExportButton,
  FilterButton,
  FilterChips,
  SearchInput,
} from "@/components/ui/Toolbar";
import { formatCurrency, formatDateLong, formatPercent } from "@/lib/format";
import { createBid, deleteBid, useBids, useBidsLoadState } from "@/lib/bidsStore";
import type { Bid } from "@/lib/types";
import { useTableSort } from "@/lib/useTableSort";

const PAGE_SIZE = 11;

type BidSortKey =
  | "reference"
  | "title"
  | "office"
  | "abc"
  | "bidAmount"
  | "delta"
  | "opening"
  | "status";

const STATUS_FILTERS = [
  "All",
  "Preparing",
  "Submitted",
  "Opened",
  "Won",
  "Lost",
  "Cancelled",
] as const;

function exportCsv(bids: Bid[]) {
  const headers = [
    "Reference No",
    "Title",
    "Office",
    "ABC",
    "Bid Amount",
    "Bid Bond",
    "Bond Posted",
    "Pre-bid",
    "Opening",
    "Status",
    "Awarded To",
    "Award Amount",
  ];
  const rows = bids.map((b) =>
    [
      b.referenceNumber,
      b.title,
      b.clientOffice,
      String(b.abc),
      String(b.bidAmount),
      String(b.bidBondAmount),
      b.bidBondPosted ? "Yes" : "No",
      b.preBidDate,
      b.openingDate,
      b.status,
      b.awardedTo,
      String(b.awardAmount),
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
  );
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bids-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** How far our bid sits below the approved budget. */
function bidVsAbc(bid: Bid): number | null {
  if (bid.abc <= 0 || bid.bidAmount <= 0) return null;
  return (bid.abc - bid.bidAmount) / bid.abc;
}

export default function BiddingPage() {
  const bids = useBids();
  const loadState = useBidsLoadState();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bids.filter((bid) => {
      if (statusFilter !== "All" && bid.status !== statusFilter) return false;
      if (!q) return true;
      return (
        bid.referenceNumber.toLowerCase().includes(q) ||
        bid.title.toLowerCase().includes(q) ||
        bid.clientOffice.toLowerCase().includes(q) ||
        bid.awardedTo.toLowerCase().includes(q)
      );
    });
  }, [bids, query, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: bids.length };
    for (const f of STATUS_FILTERS) if (f !== "All") counts[f] = 0;
    for (const b of bids) counts[b.status] = (counts[b.status] ?? 0) + 1;
    return counts;
  }, [bids]);

  const stats: Stat[] = useMemo(() => {
    const active = bids.filter(
      (b) => b.status === "Preparing" || b.status === "Submitted" || b.status === "Opened"
    );
    const won = bids.filter((b) => b.status === "Won");
    const wonValue = won.reduce((sum, b) => sum + (b.awardAmount || b.bidAmount), 0);
    return [
      { label: "Total bids", value: String(bids.length) },
      {
        label: "Active",
        value: String(active.length),
        hint: `${formatCurrency(active.reduce((s, b) => s + b.abc, 0))} in ABC`,
      },
      { label: "Awarded value", value: formatCurrency(wonValue) },
    ];
  }, [bids]);

  const { sorted, sort, toggle } = useTableSort<Bid, BidSortKey>(
    filtered,
    (bid, key) => {
      switch (key) {
        case "reference":
          return bid.referenceNumber;
        case "title":
          return bid.title;
        case "office":
          return bid.clientOffice;
        case "abc":
          return bid.abc || null;
        case "bidAmount":
          return bid.bidAmount || null;
        case "delta":
          return bidVsAbc(bid);
        case "opening":
          return bid.openingDate;
        case "status":
          return bid.status;
      }
    },
    { key: "opening", dir: "asc" }
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const bid = await createBid();
      router.push(`/projects/bidding/${bid.id}`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to create bid. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  function handleDelete(bid: Bid) {
    const label = bid.referenceNumber.trim() || bid.title.trim() || "this bid";
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteBid(bid.id);
    }
  }

  function handleExport() {
    if (filtered.length === 0) {
      window.alert("No bids to export.");
      return;
    }
    exportCsv(filtered);
  }

  const isLoading = loadState === "loading" || loadState === "idle";

  return (
    <AppShell>
      <ListPageChrome
        title="Bidding"
        description="Public bidding opportunities, our submissions, bid bonds, and award results."
        stats={<StatStrip stats={stats} />}
        toolbar={
          <>
            <SearchInput
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="Search bids"
            />
            <FilterButton
              active={showFilters || statusFilter !== "All"}
              onClick={() => setShowFilters((v) => !v)}
            />
            <ExportButton onClick={handleExport} />
            <CreateButton onClick={handleCreate} disabled={isCreating} label="New Bid" />
          </>
        }
        filters={
          showFilters ? (
            <FilterChips
              options={STATUS_FILTERS}
              value={statusFilter}
              counts={statusCounts}
              onChange={(next) => {
                setStatusFilter(next);
                setPage(1);
              }}
            />
          ) : null
        }
        cardMeta={
          <span className="ui-num text-xs text-[var(--ink-500)]">
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </span>
        }
      >
        <div className="ui-table-scroll">
          <table className="ui-table ui-table-fixed min-w-[1124px]">
            <colgroup>
              <col className="w-[124px]" />
              <col className="w-[212px]" />
              <col className="w-[160px]" />
              <col className="w-[126px]" />
              <col className="w-[126px]" />
              <col className="w-[104px]" />
              <col className="w-[96px]" />
              <col className="w-[96px]" />
              <col className="w-[104px]" />
              <col className="w-[76px]" />
            </colgroup>
            <thead>
              <tr>
                <SortableTh
                  columnKey="reference"
                  label="Reference No"
                  sort={sort}
                  onSort={toggle}
                />
                <SortableTh columnKey="title" label="Title" sort={sort} onSort={toggle} />
                <SortableTh columnKey="office" label="Office" sort={sort} onSort={toggle} />
                <SortableTh
                  columnKey="abc"
                  label="ABC"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                  className="ui-num-cell"
                />
                <SortableTh
                  columnKey="bidAmount"
                  label="Our Bid"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                  className="ui-num-cell"
                />
                <SortableTh
                  columnKey="delta"
                  label="Below ABC"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                  className="ui-num-cell"
                />
                <th>Bid Bond</th>
                <SortableTh columnKey="opening" label="Opening" sort={sort} onSort={toggle} />
                <SortableTh columnKey="status" label="Status" sort={sort} onSort={toggle} />
                <th className="ui-col-actions text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((bid) => {
                const delta = bidVsAbc(bid);
                const reference = bid.referenceNumber.trim();
                const title = bid.title.trim();
                const office = bid.clientOffice.trim();
                return (
                  <tr key={bid.id}>
                    <td className="ui-truncate">
                      <Link
                        href={`/projects/bidding/${bid.id}`}
                        className="ui-link ui-num"
                        title={reference || "Untitled"}
                      >
                        {reference || "Untitled"}
                      </Link>
                    </td>
                    <td>
                      <p className="ui-cell-strong" title={title || undefined}>
                        {title || (
                          <span className="font-normal text-[var(--ink-400)]">No title</span>
                        )}
                      </p>
                      {bid.status === "Lost" && bid.awardedTo.trim() ? (
                        <p className="ui-cell-sub">Awarded to {bid.awardedTo}</p>
                      ) : null}
                    </td>
                    <td className="ui-truncate" title={office || undefined}>
                      {office || "—"}
                    </td>
                    <td className="ui-num-cell">
                      {bid.abc > 0 ? formatCurrency(bid.abc) : "—"}
                    </td>
                    <td className="ui-num-cell ui-cell-strong">
                      {bid.bidAmount > 0 ? formatCurrency(bid.bidAmount) : "—"}
                    </td>
                    <td className="ui-num-cell">
                      {delta === null ? (
                        <span className="text-[var(--ink-300)]">—</span>
                      ) : (
                        <span
                          className={
                            delta >= 0
                              ? "font-semibold text-[var(--ok)]"
                              : "font-semibold text-[var(--danger)]"
                          }
                        >
                          {formatPercent(delta)}
                        </span>
                      )}
                    </td>
                    <td>
                      {bid.bidBondAmount > 0 ? (
                        <span
                          className={`ui-badge ${bid.bidBondPosted ? "ui-badge-ok" : "ui-badge-warn"}`}
                        >
                          {bid.bidBondPosted ? "Posted" : "Pending"}
                        </span>
                      ) : (
                        <span className="text-[var(--ink-300)]">—</span>
                      )}
                    </td>
                    <td className="ui-truncate">
                      {bid.openingDate ? formatDateLong(bid.openingDate) : "—"}
                    </td>
                    <td>
                      <BidStatusBadge status={bid.status} />
                    </td>
                    <td className="ui-col-actions">
                      <div className="ui-row-actions">
                        {bid.projectId ? (
                          <Link
                            href={`/projects/${bid.projectId}`}
                            className="ui-icon-btn ui-icon-btn-bare"
                            aria-label={`View project for ${reference || "bid"}`}
                            title="View project"
                          >
                            <ExternalLinkIcon size={14} />
                          </Link>
                        ) : (
                          <Link
                            href={`/projects/bidding/${bid.id}`}
                            className="ui-icon-btn ui-icon-btn-bare"
                            aria-label={`Open bid ${reference || "record"}`}
                            title="Open bid"
                          >
                            <PencilIcon size={14} />
                          </Link>
                        )}
                        <RowMenu
                          actions={[
                            {
                              key: "edit",
                              label: "Edit bid",
                              href: `/projects/bidding/${bid.id}`,
                            },
                            ...(bid.projectId
                              ? [
                                  {
                                    key: "project",
                                    label: "View project",
                                    href: `/projects/${bid.projectId}`,
                                  },
                                ]
                              : []),
                            {
                              key: "delete",
                              label: "Delete",
                              danger: true,
                              separated: true,
                              onSelect: () => handleDelete(bid),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="!h-auto !p-0">
                    <EmptyState
                      title={
                        isLoading
                          ? "Loading bids…"
                          : loadState === "error"
                            ? "Couldn't load bids"
                            : "No bids found"
                      }
                      description={
                        loadState === "error"
                          ? "Please refresh the page to try again."
                          : isLoading
                            ? undefined
                            : "Track an Invitation to Bid here, then record the outcome once bids are opened."
                      }
                      action={
                        loadState === "loaded" ? (
                          <button
                            type="button"
                            onClick={handleCreate}
                            className="ui-btn ui-btn-primary"
                          >
                            New Bid
                          </button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <Pagination
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={filtered.length}
            pageCount={pageCount}
            currentPage={currentPage}
            onPageChange={setPage}
          />
        )}
      </ListPageChrome>
    </AppShell>
  );
}
