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
import { QuoteStatusBadge } from "@/components/ui/StatusBadge";
import {
  CreateButton,
  ExportButton,
  FilterButton,
  FilterChips,
  ImportButton,
  SearchInput,
} from "@/components/ui/Toolbar";
import { computeQuoteTotals } from "@/lib/calc";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { parseQuoteSpreadsheet } from "@/lib/quoteImport";
import {
  createQuote,
  deleteQuote,
  duplicateQuote,
  importQuotes,
  markQuoteWon,
  useQuotes,
  useQuotesLoadState,
} from "@/lib/store";
import {
  getProjectByQuoteIdFromCache,
  upsertProjectInCache,
  useProjects,
} from "@/lib/projectsStore";
import type { Quote } from "@/lib/types";
import { useTableSort } from "@/lib/useTableSort";

const PAGE_SIZE = 11;

const STATUS_FILTERS = ["All", "Draft", "Sent", "Approved", "Won"] as const;

type QuoteSortKey =
  | "quoteNumber"
  | "customer"
  | "items"
  | "preparedBy"
  | "date"
  | "amount"
  | "status";

function itemsSummary(quote: Quote): string {
  if (quote.items.length === 0) return "—";
  const first = quote.items[0].title.trim() || "Untitled item";
  if (quote.items.length === 1) return first;
  return `${first} +${quote.items.length - 1} more`;
}

function exportCsv(quotes: Quote[]) {
  const headers = [
    "Quotation No",
    "Customer Name",
    "Office",
    "Address",
    "Items",
    "Quotation By",
    "Date",
    "Status",
    "Amount",
  ];
  const rows = quotes.map((q) => {
    const totals = computeQuoteTotals(q);
    return [
      q.quoteNumber,
      q.client.name,
      q.client.office,
      q.client.address,
      itemsSummary(q),
      q.preparedBy.name,
      q.date,
      q.status,
      String(totals.grandTotal),
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
  });
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quotations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const quotes = useQuotes();
  const projects = useProjects();
  const loadState = useQuotesLoadState();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [markingWonId, setMarkingWonId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (statusFilter !== "All" && quote.status !== statusFilter) return false;
      if (!q) return true;
      return (
        quote.quoteNumber.toLowerCase().includes(q) ||
        quote.client.name.toLowerCase().includes(q) ||
        quote.client.office.toLowerCase().includes(q) ||
        quote.client.address.toLowerCase().includes(q) ||
        quote.preparedBy.name.toLowerCase().includes(q) ||
        quote.items.some((item) => item.title.toLowerCase().includes(q))
      );
    });
  }, [quotes, query, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: quotes.length };
    for (const filter of STATUS_FILTERS) {
      if (filter !== "All") counts[filter] = 0;
    }
    for (const q of quotes) counts[q.status] = (counts[q.status] ?? 0) + 1;
    return counts;
  }, [quotes]);

  const stats: Stat[] = useMemo(() => {
    const pipeline = quotes
      .filter((q) => q.status !== "Won")
      .reduce((sum, q) => sum + computeQuoteTotals(q).grandTotal, 0);
    const wonValue = quotes
      .filter((q) => q.status === "Won")
      .reduce((sum, q) => sum + computeQuoteTotals(q).grandTotal, 0);
    return [
      { label: "Total quotations", value: String(quotes.length) },
      {
        label: "Open pipeline",
        value: formatCurrency(pipeline),
        hint: `${quotes.filter((q) => q.status !== "Won").length} open quotations`,
      },
      {
        label: "Won value",
        value: formatCurrency(wonValue),
        hint: `${statusCounts.Won ?? 0} converted to projects`,
      },
      {
        label: "Awaiting client",
        value: String(statusCounts.Sent ?? 0),
        hint: "Sent, pending response",
      },
    ];
  }, [quotes, statusCounts]);

  const rows = useMemo(
    () =>
      filtered.map((quote) => ({
        quote,
        total: computeQuoteTotals(quote).grandTotal,
      })),
    [filtered]
  );

  const { sorted, sort, toggle } = useTableSort<(typeof rows)[number], QuoteSortKey>(
    rows,
    (row, key) => {
      switch (key) {
        case "quoteNumber":
          return row.quote.quoteNumber;
        case "customer":
          return row.quote.client.name.trim() || row.quote.client.office;
        case "items":
          return row.quote.items.length;
        case "preparedBy":
          return row.quote.preparedBy.name;
        case "date":
          return row.quote.date;
        case "amount":
          return row.total;
        case "status":
          return row.quote.status;
      }
    },
    { key: "date", dir: "desc" }
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((row) => selected.has(row.quote.id));

  function toggleAllPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of pageRows) {
        if (allPageSelected) next.delete(row.quote.id);
        else next.add(row.quote.id);
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleNewQuote() {
    setIsCreating(true);
    try {
      const quote = await createQuote();
      router.push(`/quotes/${quote.id}`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to create quote. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDuplicate(id: string) {
    const copy = await duplicateQuote(id);
    if (copy) router.push(`/quotes/${copy.id}`);
  }

  function handleDelete(id: string, quoteNumber: string) {
    if (window.confirm(`Delete quote ${quoteNumber}? This cannot be undone.`)) {
      deleteQuote(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleMarkWon(quote: Quote) {
    setMarkingWonId(quote.id);
    try {
      const { project } = await markQuoteWon(quote.id);
      upsertProjectInCache(project);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to mark quotation as won. Please try again.");
    } finally {
      setMarkingWonId(null);
    }
  }

  function projectHrefForQuote(quoteId: string): string | null {
    const found =
      getProjectByQuoteIdFromCache(quoteId) ?? projects.find((p) => p.quoteId === quoteId);
    return found ? `/projects/${found.id}` : null;
  }

  function handleExport() {
    const rows = selected.size > 0 ? quotes.filter((q) => selected.has(q.id)) : filtered;
    if (rows.length === 0) {
      window.alert("No quotations to export.");
      return;
    }
    exportCsv(rows);
  }

  async function handleImport(file: File) {
    setIsImporting(true);
    try {
      const rows = await parseQuoteSpreadsheet(file);
      if (rows.length === 0) {
        window.alert(
          "No quotations found in that file. Check that the first row has column headers such as Quotation No, Customer Name, Office, Date, and Item."
        );
        return;
      }
      const { imported, skipped, messages } = await importQuotes(rows);
      const parts = [`Imported ${imported.length} quotation${imported.length === 1 ? "" : "s"}.`];
      if (skipped > 0) parts.push(`Skipped ${skipped}.`);
      if (messages.length > 0) parts.push(messages.slice(0, 5).join("\n"));
      window.alert(parts.join("\n"));
      setPage(1);
    } catch (err) {
      console.error(err);
      window.alert("Failed to import Excel file. Please check the format and try again.");
    } finally {
      setIsImporting(false);
    }
  }

  const isLoading = loadState === "loading" || loadState === "idle";

  return (
    <AppShell>
      <ListPageChrome
        title="Quotations"
        description="Prepare, issue, and track client quotations through to award."
        stats={<StatStrip stats={stats} />}
        toolbar={
          <>
            <SearchInput
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="Search quotations"
            />
            <FilterButton
              active={showFilters || statusFilter !== "All"}
              onClick={() => setShowFilters((v) => !v)}
            />
            <ExportButton onClick={handleExport} />
            <ImportButton onFile={handleImport} disabled={isImporting} />
            <CreateButton
              onClick={handleNewQuote}
              disabled={isCreating}
              label="New Quotation"
            />
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
            {selected.size > 0 ? (
              <span className="ml-2 font-semibold text-[var(--brand)]">
                {selected.size} selected
              </span>
            ) : null}
          </span>
        }
      >
        <div className="ui-table-scroll">
          <table className="ui-table ui-table-fixed min-w-[1104px]">
            <colgroup>
              <col className="w-[40px]" />
              <col className="w-[116px]" />
              <col className="w-[196px]" />
              <col className="w-[190px]" />
              <col className="w-[128px]" />
              <col className="w-[96px]" />
              <col className="w-[126px]" />
              <col className="w-[100px]" />
              <col className="w-[112px]" />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAllPage}
                    aria-label="Select all on page"
                    className="ui-checkbox"
                  />
                </th>
                <SortableTh
                  columnKey="quoteNumber"
                  label="Quotation No"
                  sort={sort}
                  onSort={toggle}
                />
                <SortableTh columnKey="customer" label="Customer" sort={sort} onSort={toggle} />
                <SortableTh columnKey="items" label="Items" sort={sort} onSort={toggle} />
                <SortableTh
                  columnKey="preparedBy"
                  label="Prepared By"
                  sort={sort}
                  onSort={toggle}
                />
                <SortableTh columnKey="date" label="Date" sort={sort} onSort={toggle} />
                <SortableTh
                  columnKey="amount"
                  label="Amount"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                  className="ui-num-cell"
                />
                <SortableTh columnKey="status" label="Status" sort={sort} onSort={toggle} />
                <th className="ui-col-actions text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(({ quote, total }) => {
                const name = quote.client.name.trim() || "Untitled client";
                const office = quote.client.office.trim();
                const items = itemsSummary(quote);
                const preparedBy = quote.preparedBy.name.trim();
                const projectHref = projectHrefForQuote(quote.id);
                const isMarking = markingWonId === quote.id;
                const isSelected = selected.has(quote.id);
                return (
                  <tr key={quote.id} className={isSelected ? "ui-row-selected" : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(quote.id)}
                        aria-label={`Select ${quote.quoteNumber}`}
                        className="ui-checkbox"
                      />
                    </td>
                    <td className="ui-truncate">
                      <Link href={`/quotes/${quote.id}`} className="ui-link ui-num">
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td>
                      <p className="ui-cell-strong" title={name}>
                        {name}
                      </p>
                      {office ? (
                        <p className="ui-cell-sub" title={office}>
                          {office}
                        </p>
                      ) : null}
                    </td>
                    <td className="ui-truncate" title={items}>
                      {items}
                    </td>
                    <td className="ui-truncate" title={preparedBy || undefined}>
                      {preparedBy || "—"}
                    </td>
                    <td className="ui-truncate">{formatDateLong(quote.date)}</td>
                    <td className="ui-num-cell ui-cell-strong">{formatCurrency(total)}</td>
                    <td>
                      <QuoteStatusBadge status={quote.status} />
                    </td>
                    <td className="ui-col-actions">
                      <div className="ui-row-actions">
                        {projectHref ? (
                          <Link
                            href={projectHref}
                            className="ui-btn ui-btn-sm ui-btn-ok-outline"
                          >
                            Project
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled={isMarking}
                            onClick={() => handleMarkWon(quote)}
                            className="ui-btn ui-btn-sm ui-btn-ghost"
                          >
                            {isMarking ? "Marking…" : "Mark Won"}
                          </button>
                        )}
                        <RowMenu
                          actions={[
                            { key: "edit", label: "Edit", href: `/quotes/${quote.id}` },
                            {
                              key: "print",
                              label: "Print preview",
                              href: `/quotes/${quote.id}/print`,
                            },
                            projectHref
                              ? { key: "project", label: "View project", href: projectHref }
                              : {
                                  key: "won",
                                  label: isMarking ? "Marking…" : "Mark as Won",
                                  onSelect: () => handleMarkWon(quote),
                                  disabled: isMarking,
                                },
                            {
                              key: "duplicate",
                              label: "Duplicate",
                              onSelect: () => handleDuplicate(quote.id),
                            },
                            {
                              key: "delete",
                              label: "Delete",
                              danger: true,
                              separated: true,
                              onSelect: () => handleDelete(quote.id, quote.quoteNumber),
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
                  <td colSpan={9} className="!h-auto !p-0">
                    <EmptyState
                      title={
                        isLoading
                          ? "Loading quotations…"
                          : loadState === "error"
                            ? "Couldn't load quotations"
                            : "No quotations found"
                      }
                      description={
                        loadState === "error"
                          ? "Please refresh the page to try again."
                          : isLoading
                            ? undefined
                            : "Adjust your search or filters, or create a new quotation."
                      }
                      action={
                        loadState === "loaded" ? (
                          <button
                            type="button"
                            onClick={handleNewQuote}
                            className="ui-btn ui-btn-primary"
                          >
                            New Quotation
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
            meta={
              selected.size > 0 ? (
                <span className="ml-2 font-semibold text-[var(--brand)]">
                  · {selected.size} selected ·{" "}
                  {formatCurrency(
                    quotes
                      .filter((q) => selected.has(q.id))
                      .reduce((sum, q) => sum + computeQuoteTotals(q).grandTotal, 0)
                  )}
                </span>
              ) : null
            }
          />
        )}
      </ListPageChrome>
    </AppShell>
  );
}
