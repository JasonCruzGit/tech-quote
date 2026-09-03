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
import { PencilIcon } from "@/components/ui/Icons";
import { RfqStatusBadge } from "@/components/ui/StatusBadge";
import {
  CreateButton,
  ExportButton,
  FilterButton,
  FilterChips,
  SearchInput,
} from "@/components/ui/Toolbar";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { createRfq, deleteRfq, useRfqs, useRfqsLoadState } from "@/lib/rfqStore";
import { daysUntil, deadlineTone } from "@/lib/deadline";
import type { Rfq } from "@/lib/types";
import { useTableSort } from "@/lib/useTableSort";

const PAGE_SIZE = 11;

type RfqSortKey =
  | "rfqNumber"
  | "title"
  | "office"
  | "received"
  | "deadline"
  | "abc"
  | "mode"
  | "status";

const STATUS_FILTERS = [
  "All",
  "New",
  "Quoted",
  "Submitted",
  "Won",
  "Lost",
  "Cancelled",
] as const;

function exportCsv(rfqs: Rfq[]) {
  const headers = [
    "RFQ No",
    "Title",
    "Contact",
    "Office",
    "Date Received",
    "Deadline",
    "ABC",
    "Mode",
    "Status",
    "Quotation",
  ];
  const rows = rfqs.map((r) =>
    [
      r.rfqNumber,
      r.title,
      r.clientName,
      r.clientOffice,
      r.dateReceived,
      r.deadline,
      String(r.abc),
      r.modeOfProcurement,
      r.status,
      r.quoteNumber ?? "",
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
  );
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rfqs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DeadlineCell({ deadline, status }: { deadline: string; status: Rfq["status"] }) {
  if (!deadline) return <span className="text-[var(--ink-300)]">—</span>;

  const days = daysUntil(deadline);
  const closed = status === "Won" || status === "Lost" || status === "Cancelled";
  const tone = closed ? "neutral" : deadlineTone(days);

  return (
    <div className="whitespace-nowrap">
      <p className="text-[var(--ink-700)]">{formatDateLong(deadline)}</p>
      {!closed && days !== null ? (
        <p
          className={`ui-cell-sub font-semibold ${
            tone === "danger"
              ? "!text-[var(--danger)]"
              : tone === "warn"
                ? "!text-[var(--warn)]"
                : ""
          }`}
        >
          {days < 0
            ? `${Math.abs(days)}d overdue`
            : days === 0
              ? "Due today"
              : `${days}d left`}
        </p>
      ) : null}
    </div>
  );
}

export default function RfqPage() {
  const rfqs = useRfqs();
  const loadState = useRfqsLoadState();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rfqs.filter((rfq) => {
      if (statusFilter !== "All" && rfq.status !== statusFilter) return false;
      if (!q) return true;
      return (
        rfq.rfqNumber.toLowerCase().includes(q) ||
        rfq.title.toLowerCase().includes(q) ||
        rfq.clientName.toLowerCase().includes(q) ||
        rfq.clientOffice.toLowerCase().includes(q) ||
        (rfq.quoteNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [rfqs, query, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: rfqs.length };
    for (const f of STATUS_FILTERS) if (f !== "All") counts[f] = 0;
    for (const r of rfqs) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  }, [rfqs]);

  const stats: Stat[] = useMemo(() => {
    const open = rfqs.filter(
      (r) => r.status === "New" || r.status === "Quoted" || r.status === "Submitted"
    );
    const pipeline = open.reduce((sum, r) => sum + r.abc, 0);
    const dueSoon = open.filter((r) => {
      const d = daysUntil(r.deadline);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    const overdue = open.filter((r) => {
      const d = daysUntil(r.deadline);
      return d !== null && d < 0;
    }).length;
    return [
      { label: "Total RFQs", value: String(rfqs.length) },
      {
        label: "Open",
        value: String(open.length),
        hint: `${statusCounts.New ?? 0} not yet quoted`,
      },
      { label: "Open ABC value", value: formatCurrency(pipeline) },
      {
        label: "Due within 7 days",
        value: String(dueSoon),
        hint: overdue > 0 ? `${overdue} past deadline` : "None overdue",
      },
    ];
  }, [rfqs, statusCounts]);

  const { sorted, sort, toggle } = useTableSort<Rfq, RfqSortKey>(
    filtered,
    (rfq, key) => {
      switch (key) {
        case "rfqNumber":
          return rfq.rfqNumber;
        case "title":
          return rfq.title;
        case "office":
          return rfq.clientOffice;
        case "received":
          return rfq.dateReceived;
        case "deadline":
          return rfq.deadline;
        case "abc":
          return rfq.abc;
        case "mode":
          return rfq.modeOfProcurement;
        case "status":
          return rfq.status;
      }
    },
    { key: "deadline", dir: "asc" }
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const rfq = await createRfq();
      router.push(`/projects/rfq/${rfq.id}`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to create RFQ. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  function handleDelete(rfq: Rfq) {
    const label = rfq.rfqNumber.trim() || rfq.title.trim() || "this RFQ";
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      deleteRfq(rfq.id);
    }
  }

  function handleExport() {
    if (filtered.length === 0) {
      window.alert("No RFQs to export.");
      return;
    }
    exportCsv(filtered);
  }

  const isLoading = loadState === "loading" || loadState === "idle";

  return (
    <AppShell>
      <ListPageChrome
        title="RFQ"
        description="Requests for quotation received from client offices, tracked through to submission."
        stats={<StatStrip stats={stats} />}
        toolbar={
          <>
            <SearchInput
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="Search RFQs"
            />
            <FilterButton
              active={showFilters || statusFilter !== "All"}
              onClick={() => setShowFilters((v) => !v)}
            />
            <ExportButton onClick={handleExport} />
            <CreateButton onClick={handleCreate} disabled={isCreating} label="Log RFQ" />
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
          <table className="ui-table ui-table-fixed min-w-[1116px]">
            <colgroup>
              <col className="w-[116px]" />
              <col className="w-[224px]" />
              <col className="w-[168px]" />
              <col className="w-[96px]" />
              <col className="w-[112px]" />
              <col className="w-[124px]" />
              <col className="w-[124px]" />
              <col className="w-[100px]" />
              <col className="w-[104px]" />
              <col className="w-[78px]" />
            </colgroup>
            <thead>
              <tr>
                <SortableTh columnKey="rfqNumber" label="RFQ No" sort={sort} onSort={toggle} />
                <SortableTh columnKey="title" label="Title" sort={sort} onSort={toggle} />
                <SortableTh
                  columnKey="office"
                  label="Client Office"
                  sort={sort}
                  onSort={toggle}
                />
                <SortableTh columnKey="received" label="Received" sort={sort} onSort={toggle} />
                <SortableTh columnKey="deadline" label="Deadline" sort={sort} onSort={toggle} />
                <SortableTh
                  columnKey="abc"
                  label="ABC"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                  className="ui-num-cell"
                />
                <SortableTh columnKey="mode" label="Mode" sort={sort} onSort={toggle} />
                <th>Quotation</th>
                <SortableTh columnKey="status" label="Status" sort={sort} onSort={toggle} />
                <th className="ui-col-actions text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((rfq) => {
                const number = rfq.rfqNumber.trim();
                const title = rfq.title.trim();
                const office = rfq.clientOffice.trim();
                return (
                  <tr key={rfq.id}>
                    <td className="ui-truncate">
                      <Link
                        href={`/projects/rfq/${rfq.id}`}
                        className="ui-link ui-num"
                        title={number || "Untitled"}
                      >
                        {number || "Untitled"}
                      </Link>
                    </td>
                    <td>
                      <p className="ui-cell-strong" title={title || undefined}>
                        {title || (
                          <span className="font-normal text-[var(--ink-400)]">No title</span>
                        )}
                      </p>
                      {rfq.clientName.trim() ? (
                        <p className="ui-cell-sub" title={rfq.clientName}>
                          {rfq.clientName}
                        </p>
                      ) : null}
                    </td>
                    <td className="ui-truncate" title={office || undefined}>
                      {office || "—"}
                    </td>
                    <td className="ui-truncate">
                      {rfq.dateReceived ? formatDateLong(rfq.dateReceived) : "—"}
                    </td>
                    <td>
                      <DeadlineCell deadline={rfq.deadline} status={rfq.status} />
                    </td>
                    <td className="ui-num-cell">
                      {rfq.abc > 0 ? formatCurrency(rfq.abc) : "—"}
                    </td>
                    <td className="ui-truncate text-xs" title={rfq.modeOfProcurement}>
                      {rfq.modeOfProcurement}
                    </td>
                    <td className="ui-truncate">
                      {rfq.quoteId && rfq.quoteNumber ? (
                        <Link href={`/quotes/${rfq.quoteId}`} className="ui-link ui-num text-xs">
                          {rfq.quoteNumber}
                        </Link>
                      ) : (
                        <span className="text-[var(--ink-300)]">—</span>
                      )}
                    </td>
                    <td>
                      <RfqStatusBadge status={rfq.status} />
                    </td>
                    <td className="ui-col-actions">
                      <div className="ui-row-actions">
                        <Link
                          href={`/projects/rfq/${rfq.id}`}
                          className="ui-icon-btn ui-icon-btn-bare"
                          aria-label={`Open RFQ ${number || "record"}`}
                          title="Open RFQ"
                        >
                          <PencilIcon size={14} />
                        </Link>
                        <RowMenu
                          actions={[
                            { key: "edit", label: "Edit RFQ", href: `/projects/rfq/${rfq.id}` },
                            ...(rfq.quoteId
                              ? [
                                  {
                                    key: "quote",
                                    label: "View quotation",
                                    href: `/quotes/${rfq.quoteId}`,
                                  },
                                ]
                              : []),
                            {
                              key: "delete",
                              label: "Delete",
                              danger: true,
                              separated: true,
                              onSelect: () => handleDelete(rfq),
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
                          ? "Loading RFQs…"
                          : loadState === "error"
                            ? "Couldn't load RFQs"
                            : "No RFQs found"
                      }
                      description={
                        loadState === "error"
                          ? "Please refresh the page to try again."
                          : isLoading
                            ? undefined
                            : "Log a request for quotation when a client office sends one, then convert it into a quotation."
                      }
                      action={
                        loadState === "loaded" ? (
                          <button
                            type="button"
                            onClick={handleCreate}
                            className="ui-btn ui-btn-primary"
                          >
                            Log RFQ
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
