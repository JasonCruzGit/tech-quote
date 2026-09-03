"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import PrintableQuote from "@/components/print/PrintableQuote";
import PageHeader from "@/components/ui/PageHeader";
import SaveIndicator from "@/components/ui/SaveIndicator";
import SectionCard from "@/components/ui/SectionCard";
import { QuoteStatusBadge } from "@/components/ui/StatusBadge";
import { computeQuoteTotals } from "@/lib/calc";
import { formatCurrency, formatPercent } from "@/lib/format";
import { updateQuote, deleteQuote, saveQuoteAsNew, useSavingStatus } from "@/lib/store";
import type { Client, LineItem, PreparedBy, Quote, Terms } from "@/lib/types";
import ClientPanel from "./ClientPanel";
import LineItemsSection from "./LineItemsSection";
import QuoteMetaPanel from "./QuoteMetaPanel";
import SignaturePanel from "./SignaturePanel";
import TermsPanel from "./TermsPanel";

interface QuoteEditorProps {
  quote: Quote;
}

function cloneQuote(quote: Quote): Quote {
  return structuredClone(quote);
}

export default function QuoteEditor({ quote }: QuoteEditorProps) {
  const router = useRouter();
  const isSaving = useSavingStatus();
  const [activeTab, setActiveTab] = useState<"details" | "items" | "terms" | "preview">(
    "items"
  );
  const [isSavingAsNew, setIsSavingAsNew] = useState(false);
  const baselineRef = useRef<Quote | null>(null);
  const totals = computeQuoteTotals(quote);

  useEffect(() => {
    baselineRef.current = cloneQuote(quote);
    // Snapshot once when opening / switching to this quote
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: capture at open only
  }, [quote.id]);

  function patch(partial: Partial<Quote>) {
    updateQuote(quote.id, (q) => ({ ...q, ...partial }));
  }

  function patchClient(partial: Partial<Client>) {
    patch({ client: { ...quote.client, ...partial } });
  }

  function patchTerms(partial: Partial<Terms>) {
    patch({ terms: { ...quote.terms, ...partial } });
  }

  function patchPreparedBy(partial: Partial<PreparedBy>) {
    patch({ preparedBy: { ...quote.preparedBy, ...partial } });
  }

  function setItems(items: LineItem[]) {
    patch({ items });
  }

  function handleDelete() {
    if (window.confirm(`Delete quote ${quote.quoteNumber}? This cannot be undone.`)) {
      deleteQuote(quote.id);
      router.push("/");
    }
  }

  async function handleSaveAsNew() {
    const restore = baselineRef.current;
    if (!restore) return;

    setIsSavingAsNew(true);
    try {
      const { quote: saved, mode } = await saveQuoteAsNew(quote.id, quote, restore);
      if (mode === "new") {
        baselineRef.current = cloneQuote(saved);
        router.push(`/quotes/${saved.id}`);
      } else {
        baselineRef.current = cloneQuote(saved);
      }
    } catch (err) {
      console.error(err);
      window.alert("Failed to save as new quotation. Please try again.");
    } finally {
      setIsSavingAsNew(false);
    }
  }

  const tabs = [
    { id: "details" as const, label: "Details", short: "Details" },
    { id: "items" as const, label: "Line items", short: "Items" },
    { id: "terms" as const, label: "Terms & signature", short: "Terms" },
    { id: "preview" as const, label: "Print preview", short: "Preview" },
  ];

  const isPreview = activeTab === "preview";

  return (
    <AppShell>
      <main className={`ui-page no-print ${isPreview ? "!bg-[#d4d4d4]" : ""}`}>
        <div className={`mx-auto w-full ${isPreview ? "max-w-[1100px]" : "max-w-4xl"}`}>
          <PageHeader
            eyebrow={`Quotation ${quote.quoteNumber}`}
            title={quote.client.name?.trim() || "Edit quotation"}
            actions={
              <>
                <SaveIndicator isSaving={isSaving || isSavingAsNew} />
                <Link href="/" className="ui-btn ui-btn-ghost">
                  Back
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="ui-btn ui-btn-danger hidden sm:inline-flex"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={handleSaveAsNew}
                  disabled={isSavingAsNew}
                  className="ui-btn ui-btn-ghost"
                  title="Keeps the original quotation and creates a new one with the next control number"
                >
                  {isSavingAsNew ? "Saving…" : "Save as New"}
                </button>
                <Link
                  href={`/quotes/${quote.id}/print`}
                  className="ui-btn ui-btn-primary"
                >
                  Publish / Print
                </Link>
              </>
            }
          />

          {!isPreview ? (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-card)]">
            <QuoteStatusBadge status={quote.status} />
            <span className="text-xs text-[var(--ink-400)]">
              {quote.items.length} line item{quote.items.length === 1 ? "" : "s"}
            </span>
            <span className="ml-auto flex items-baseline gap-2">
              <span className="ui-eyebrow">Grand total</span>
              <span className="ui-num text-base font-bold text-[var(--ink-900)]">
                {formatCurrency(totals.grandTotal)}
              </span>
            </span>
          </div>
          ) : null}

          <div className={`mb-5 flex gap-6 border-b ${isPreview ? "border-[#bdbdbd]" : "border-[var(--line)]"}`}>
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px border-b-2 pb-2.5 text-[13px] font-semibold transition-colors ${
                    active
                      ? "border-[var(--brand)] text-[var(--brand)]"
                      : "border-transparent text-[var(--ink-500)] hover:text-[var(--ink-800)]"
                  }`}
                >
                  <span className="sm:hidden">{tab.short}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {activeTab === "details" && (
              <>
                <SectionCard
                  title="Quotation details"
                  description="Control number, date, status, and VAT rate."
                >
                  <QuoteMetaPanel
                    quoteNumber={quote.quoteNumber}
                    date={quote.date}
                    status={quote.status}
                    vatPct={quote.vatPct}
                    onChange={(p) => patch(p as Partial<Quote>)}
                  />
                </SectionCard>
                <SectionCard
                  title="Quotation to"
                  description="Client contact and office information for this quote."
                >
                  <ClientPanel client={quote.client} onChange={patchClient} />
                </SectionCard>
              </>
            )}

            {activeTab === "items" && (
              <>
                <SectionCard
                  title="Product / service details"
                  description="Line items, quantities, and pricing for this quotation."
                >
                  <LineItemsSection items={quote.items} onChange={setItems} />
                </SectionCard>

                <SectionCard
                  title="Totals"
                  description="Subtotal, VAT, and overall margin for this quotation."
                >
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-500)]">Sub-total</span>
                      <span className="ui-num font-semibold text-[var(--ink-900)]">
                        {formatCurrency(totals.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-500)]">
                        VAT ({formatPercent(quote.vatPct)})
                      </span>
                      <span className="ui-num font-semibold text-[var(--ink-900)]">
                        {formatCurrency(totals.vat)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-3">
                      <span className="font-semibold text-[var(--ink-900)]">Grand total</span>
                      <span className="ui-num text-lg font-bold text-[var(--brand)]">
                        {formatCurrency(totals.grandTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface-sub)] px-4 py-3">
                    <p className="ui-eyebrow mb-2">Internal only</p>
                    <div className="flex justify-between text-xs text-[var(--ink-600)]">
                      <span>Total cost</span>
                      <span className="ui-num font-semibold">
                        {formatCurrency(totals.totalCost)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex justify-between text-xs text-[var(--ink-600)]">
                      <span>Overall margin</span>
                      <span className="ui-num font-semibold text-[var(--ok)]">
                        {formatPercent(totals.overallMarginPct)}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </>
            )}

            {activeTab === "terms" && (
              <>
                <SectionCard
                  title="Terms"
                  description="Payment, delivery, and other commercial terms."
                >
                  <TermsPanel terms={quote.terms} onChange={patchTerms} />
                </SectionCard>
                <SectionCard
                  title="Signature"
                  description="Prepared-by details shown on the printed quotation."
                >
                  <SignaturePanel preparedBy={quote.preparedBy} onChange={patchPreparedBy} />
                </SectionCard>
              </>
            )}

            {activeTab === "preview" && (
              <div className="flex justify-center pb-8">
                <PrintableQuote quote={quote} />
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
