"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import { ChevronDownIcon } from "@/components/ui/Icons";
import PageHeader from "@/components/ui/PageHeader";
import RowMenu from "@/components/ui/RowMenu";
import SaveIndicator from "@/components/ui/SaveIndicator";
import SectionCard from "@/components/ui/SectionCard";
import StatStrip from "@/components/ui/StatStrip";
import { SearchInput } from "@/components/ui/Toolbar";
import {
  computeQuoteTotals,
  lineTotalPrice,
  markupAmount,
  marginPct,
  suggestedMarginPct,
  totalCost,
  totalSellingPrice,
  unitSellingPrice,
} from "@/lib/calc";
import { formatCurrency, formatDateLong, formatPercent } from "@/lib/format";
import { useProjects, useProjectsLoadState } from "@/lib/projectsStore";
import { updateQuote, useQuotes, useQuotesLoadState, useSavingStatus } from "@/lib/store";
import type { LineItem, Project, Quote } from "@/lib/types";

interface PurchaseRow {
  project: Project;
  quote: Quote | null;
}

function numberInputProps(value: number, onValue: (v: number) => void) {
  return {
    value: Number.isFinite(value) ? value : 0,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onValue(parseFloat(e.target.value) || 0),
    type: "number" as const,
    step: "0.01",
  };
}

export default function ActualPurchasePage() {
  const projects = useProjects();
  const quotes = useQuotes();
  const projectsLoad = useProjectsLoadState();
  const quotesLoad = useQuotesLoadState();
  const isSaving = useSavingStatus();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const quoteMap = new Map(quotes.map((q) => [q.id, q]));
    const wonProjects = projects.filter((p) => p.quoteId || p.quoteNumber);
    return wonProjects
      .map((project): PurchaseRow => ({
        project,
        quote: project.quoteId ? quoteMap.get(project.quoteId) ?? null : null,
      }))
      .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
  }, [projects, quotes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ project, quote }) => {
      return (
        project.name.toLowerCase().includes(q) ||
        project.clientName.toLowerCase().includes(q) ||
        project.clientOffice.toLowerCase().includes(q) ||
        (project.quoteNumber ?? "").toLowerCase().includes(q) ||
        (quote?.client.address ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, { quote }) => {
        if (!quote) return acc;
        const t = computeQuoteTotals(quote);
        acc.subtotal += t.subtotal;
        acc.vat += t.vat;
        acc.grandTotal += t.grandTotal;
        acc.cost += t.totalCost;
        acc.count += 1;
        return acc;
      },
      { subtotal: 0, vat: 0, grandTotal: 0, cost: 0, count: 0 }
    );
  }, [filtered]);

  const loading =
    projectsLoad === "idle" ||
    projectsLoad === "loading" ||
    quotesLoad === "idle" ||
    quotesLoad === "loading";

  function patchItem(quoteId: string, itemId: string, partial: Partial<LineItem>) {
    updateQuote(quoteId, (q) => ({
      ...q,
      items: q.items.map((item) =>
        item.id === itemId ? { ...item, ...partial } : item
      ),
    }));
  }

  return (
    <AppShell>
      <main className="ui-page">
        <div className="ui-page-inner">
          <PageHeader
            title="Actual Purchase"
            subtitle="Record final item prices for won projects. Totals recalculate and save automatically."
            actions={
              <>
                <SaveIndicator isSaving={isSaving} />
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search purchases"
                />
              </>
            }
          />

          <StatStrip
            stats={[
              { label: "Won projects", value: String(filtered.length) },
              { label: "Supplier cost", value: formatCurrency(totals.cost) },
              { label: "Subtotal + VAT", value: formatCurrency(totals.subtotal + totals.vat) },
              { label: "Final total", value: formatCurrency(totals.grandTotal) },
            ]}
          />

          <section className="ui-card">
            <div className="ui-card-head">
              <h2 className="ui-card-title">Actual Purchase</h2>
              <span className="ui-num text-xs text-[var(--ink-500)]">
                {filtered.length} won project{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="ui-table-scroll">
              <table className="ui-table ui-table-fixed min-w-[1096px]">
                <colgroup>
                  <col className="w-[228px]" />
                  <col className="w-[104px]" />
                  <col className="w-[196px]" />
                  <col className="w-[124px]" />
                  <col className="w-[120px]" />
                  <col className="w-[104px]" />
                  <col className="w-[124px]" />
                  <col className="w-[88px]" />
                  <col className="w-[136px]" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Quote #</th>
                    <th>Client</th>
                    <th className="ui-num-cell">Supplier Cost</th>
                    <th className="ui-num-cell">Subtotal</th>
                    <th className="ui-num-cell">VAT</th>
                    <th className="ui-num-cell">Final Price</th>
                    <th className="ui-num-cell">Margin</th>
                    <th className="ui-col-actions text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ project, quote }) => {
                    const t = quote ? computeQuoteTotals(quote) : null;
                    const isOpen = expandedId === project.id;
                    const client =
                      [project.clientName.trim(), project.clientOffice.trim()]
                        .filter(Boolean)
                        .join(" · ") || "—";

                    return (
                      <FragmentRow
                        key={project.id}
                        project={project}
                        quote={quote}
                        totals={t}
                        client={client}
                        isOpen={isOpen}
                        onToggle={() =>
                          setExpandedId((id) => (id === project.id ? null : project.id))
                        }
                        onPatchItem={patchItem}
                      />
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="!h-auto !p-0">
                        <EmptyState
                          title={
                            loading
                              ? "Loading purchases…"
                              : query.trim()
                                ? "No purchases match your search"
                                : "No won projects yet"
                          }
                          description={
                            !loading && !query.trim()
                              ? "Mark a quotation as Won to record its final purchase pricing here."
                              : undefined
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="ui-card-foot">
                <span className="text-xs text-[var(--ink-500)]">
                  Showing{" "}
                  <span className="ui-num font-semibold text-[var(--ink-900)]">
                    {filtered.length}
                  </span>{" "}
                  won project{filtered.length === 1 ? "" : "s"}
                </span>
                <span className="text-xs text-[var(--ink-500)]">
                  Combined final price{" "}
                  <span className="ui-num ml-1 text-sm font-bold text-[var(--ink-900)]">
                    {formatCurrency(totals.grandTotal)}
                  </span>
                </span>
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function PurchaseItemForm({
  index,
  item,
  quoteId,
  onPatchItem,
}: {
  index: number;
  item: LineItem;
  quoteId: string;
  onPatchItem: (quoteId: string, itemId: string, partial: Partial<LineItem>) => void;
}) {
  const [costingOpen, setCostingOpen] = useState(true);
  const usp = unitSellingPrice(item);
  const suggestedMargin = suggestedMarginPct(item);
  const actualMargin = marginPct(item);

  function patch(partial: Partial<LineItem>) {
    onPatchItem(quoteId, item.id, partial);
  }

  return (
    <article className="ui-card">
      <div className="border-b border-[var(--line)] px-5 py-4">
        <p className="ui-card-title mb-1">Item {index + 1}</p>
        <p className="ui-card-desc mb-4">Unit price and line total for this item.</p>
        <div className="mb-4">
          <label className="ui-label">Item name</label>
          <div className="ui-input-readonly !h-auto min-h-10 py-2 font-semibold">
            {item.title.trim() || "Untitled item"}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="ui-label">Quantity</label>
            <div className="ui-input-readonly tabular-nums">
              {item.qty} {item.unit || "unit"}
            </div>
          </div>
          <div>
            <label className="ui-label" htmlFor={`price-${item.id}`}>
              Unit price
            </label>
            <input
              id={`price-${item.id}`}
              {...numberInputProps(item.unitPrice, (unitPrice) =>
                patch({ unitPrice, priceManuallySet: true })
              )}
              className="ui-input tabular-nums !font-semibold"
            />
          </div>
          <div>
            <label className="ui-label">Line total</label>
            <div className="ui-input-readonly tabular-nums !font-semibold">
              {formatCurrency(lineTotalPrice(item))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--brand-tint)]">
        <button
          type="button"
          onClick={() => setCostingOpen((v) => !v)}
          aria-expanded={costingOpen}
          className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
        >
          <span className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.04em] text-[var(--brand)] uppercase">
            Internal costing
            <span className="font-medium tracking-normal text-[var(--ink-500)] normal-case">
              hidden from client quote
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2.5">
            <span
              className={`ui-badge ${actualMargin >= 0 ? "ui-badge-ok" : "ui-badge-danger"}`}
            >
              {formatPercent(actualMargin)} margin
            </span>
            <ChevronDownIcon
              size={14}
              className={`text-[var(--ink-400)] transition-transform ${costingOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {costingOpen && (
          <div className="space-y-4 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="ui-label" htmlFor={`cost-${item.id}`}>
                  Supplier Cost (VAT exclusive)
                </label>
                <input
                  id={`cost-${item.id}`}
                  {...numberInputProps(item.supplierCost, (supplierCost) =>
                    patch({ supplierCost })
                  )}
                  className="ui-input tabular-nums"
                />
              </div>
              <div>
                <label className="ui-label" htmlFor={`markup-${item.id}`}>
                  Markup %
                </label>
                <input
                  id={`markup-${item.id}`}
                  {...numberInputProps(item.markupPct * 100, (v) =>
                    patch({ markupPct: v / 100 })
                  )}
                  className="ui-input tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="ui-label">Unit Selling Price</label>
                <div className="ui-input-readonly tabular-nums">{formatCurrency(usp)}</div>
                <button
                  type="button"
                  onClick={() => patch({ unitPrice: usp, priceManuallySet: true })}
                  className="mt-1.5 text-xs font-semibold text-[var(--brand)] hover:underline"
                >
                  Apply as unit price
                </button>
              </div>
              <div>
                <label className="ui-label">Total Cost</label>
                <div className="ui-input-readonly tabular-nums">
                  {formatCurrency(totalCost(item))}
                </div>
              </div>
              <div>
                <label className="ui-label">Total Selling Price</label>
                <div className="ui-input-readonly tabular-nums">
                  {formatCurrency(totalSellingPrice(item))}
                </div>
                <p className="mt-1.5 text-xs text-[var(--ink-500)]">
                  Suggested margin {formatPercent(suggestedMargin)}
                </p>
              </div>
              <div>
                <label className="ui-label">Markup ₱</label>
                <div className="ui-input-readonly tabular-nums">
                  {formatCurrency(markupAmount(item))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="ui-label">Actual Margin</label>
                <div
                  className={`ui-input-readonly ui-num !text-base !font-bold ${
                    actualMargin >= 0
                      ? "!border-[var(--ok-line)] !bg-[var(--ok-tint)] !text-[var(--ok)]"
                      : "!border-[var(--danger-line)] !bg-[var(--danger-tint)] !text-[var(--danger)]"
                  }`}
                >
                  {formatPercent(actualMargin)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function FragmentRow({
  project,
  quote,
  totals,
  client,
  isOpen,
  onToggle,
  onPatchItem,
}: {
  project: Project;
  quote: Quote | null;
  totals: ReturnType<typeof computeQuoteTotals> | null;
  client: string;
  isOpen: boolean;
  onToggle: () => void;
  onPatchItem: (quoteId: string, itemId: string, partial: Partial<LineItem>) => void;
}) {
  return (
    <>
      <tr>
        <td>
          <Link
            href={`/projects/${project.id}`}
            className="ui-link block truncate"
            title={project.name.trim() || "Untitled project"}
          >
            {project.name.trim() || "Untitled project"}
          </Link>
          <p className="ui-cell-sub">
            {project.startDate
              ? `Started ${formatDateLong(project.startDate)}`
              : "No start date"}
          </p>
        </td>
        <td className="ui-num ui-truncate font-semibold text-[var(--ink-800)]">
          {project.quoteNumber || quote?.quoteNumber || "—"}
        </td>
        <td className="ui-truncate" title={client}>
          {client}
        </td>
        <td className="ui-num-cell">{totals ? formatCurrency(totals.totalCost) : "—"}</td>
        <td className="ui-num-cell">{totals ? formatCurrency(totals.subtotal) : "—"}</td>
        <td className="ui-num-cell">{totals ? formatCurrency(totals.vat) : "—"}</td>
        <td className="ui-num-cell ui-cell-strong">
          {totals ? formatCurrency(totals.grandTotal) : "—"}
        </td>
        <td className="ui-num-cell font-semibold text-[var(--ok)]">
          {totals ? formatPercent(totals.overallMarginPct) : "—"}
        </td>
        <td className="ui-col-actions">
          <div className="ui-row-actions">
            {quote ? (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className={`ui-btn ui-btn-sm ${isOpen ? "ui-btn-ghost ui-btn-ghost-active" : "ui-btn-ghost"}`}
              >
                {isOpen ? "Hide form" : "Set prices"}
              </button>
            ) : null}
            <RowMenu
              actions={[
                { key: "project", label: "Open project", href: `/projects/${project.id}` },
                ...(quote
                  ? [
                      { key: "quote", label: "Edit quotation", href: `/quotes/${quote.id}` },
                      {
                        key: "print",
                        label: "Print preview",
                        href: `/quotes/${quote.id}/print`,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </td>
      </tr>
      {isOpen && quote && (
        <tr className="bg-[var(--canvas)] hover:!bg-[var(--canvas)]">
          <td colSpan={9} className="!px-5 !py-5">
            <SectionCard
              title="Item pricing form"
              description="Update unit price and internal costing for each item. Totals recalculate and save automatically."
            >
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {quote.items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--surface-sub)] px-4 py-6 text-center text-[13px] text-[var(--ink-500)]">
                    No line items on this quotation.
                  </p>
                ) : (
                  quote.items.map((item, index) => (
                    <PurchaseItemForm
                      key={item.id}
                      index={index}
                      item={item}
                      quoteId={quote.id}
                      onPatchItem={onPatchItem}
                    />
                  ))
                )}

                {totals && quote.items.length > 0 && (
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sub)] px-4 py-3.5">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="ui-eyebrow">Supplier cost</p>
                        <p className="ui-num mt-1 font-bold text-[var(--ink-900)]">
                          {formatCurrency(totals.totalCost)}
                        </p>
                      </div>
                      <div>
                        <p className="ui-eyebrow">Subtotal</p>
                        <p className="ui-num mt-1 font-bold text-[var(--ink-900)]">
                          {formatCurrency(totals.subtotal)}
                        </p>
                      </div>
                      <div>
                        <p className="ui-eyebrow">VAT</p>
                        <p className="ui-num mt-1 font-bold text-[var(--ink-900)]">
                          {formatCurrency(totals.vat)}
                        </p>
                      </div>
                      <div>
                        <p className="ui-eyebrow">Final price</p>
                        <p className="ui-num mt-1 text-base font-bold text-[var(--brand)]">
                          {formatCurrency(totals.grandTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </SectionCard>
          </td>
        </tr>
      )}
    </>
  );
}
