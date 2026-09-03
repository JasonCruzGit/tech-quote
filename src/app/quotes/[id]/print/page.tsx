"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import PrintableQuote from "@/components/print/PrintableQuote";
import { useQuote, useQuotesLoadState } from "@/lib/store";

export default function QuotePrintPage() {
  const params = useParams<{ id: string }>();
  const quote = useQuote(params.id);
  const loadState = useQuotesLoadState();

  if (!quote) {
    const isLoading = loadState === "loading" || loadState === "idle";
    return (
      <AppShell hideNav>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mb-4 text-slate-500">
            {isLoading ? "Loading quote..." : "Quote not found. It may have been deleted."}
          </p>
          {!isLoading && (
            <Link href="/" className="ui-link text-sm">
              ← Back to Quotes
            </Link>
          )}
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <div className="no-print sticky top-0 z-10 border-b border-[var(--line)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3">
          <Link href={`/quotes/${quote.id}`} className="text-sm text-[#6b7280] hover:text-black">
            ← Back to editor
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[#9ca3af] sm:inline">
              Client-facing · internal costing hidden
            </span>
            <button
              onClick={() => window.print()}
              className="ui-btn ui-btn-primary ui-btn-sm"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 bg-[#d4d4d4] px-4 py-8 print:bg-white print:p-0">
        <div className="mx-auto flex w-full max-w-[1100px] justify-center print:max-w-none">
          <PrintableQuote quote={quote} />
        </div>
      </main>
    </AppShell>
  );
}
