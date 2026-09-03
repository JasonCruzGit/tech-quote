"use client";

import { computeQuoteTotals } from "@/lib/calc";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Quote } from "@/lib/types";

interface TotalsPanelProps {
  quote: Quote;
}

export default function TotalsPanel({ quote }: TotalsPanelProps) {
  const totals = computeQuoteTotals(quote);

  return (
    <section className="ui-panel overflow-hidden">
      <div className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Totals</h2>

        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="tabular-nums font-medium text-slate-800">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">VAT ({formatPercent(quote.vatPct)})</span>
            <span className="tabular-nums font-medium text-slate-800">
              {formatCurrency(totals.vat)}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3">
            <span className="font-semibold text-slate-900">Grand Total</span>
            <span className="tabular-nums text-base font-semibold text-slate-900">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
        <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Internal summary
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Cost</span>
            <span className="tabular-nums text-slate-700">{formatCurrency(totals.totalCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Markup</span>
            <span className="tabular-nums text-slate-700">{formatCurrency(totals.totalMarkup)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Overall Margin</span>
            <span
              className={`tabular-nums font-semibold ${
                totals.overallMarginPct >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {formatPercent(totals.overallMarginPct)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
