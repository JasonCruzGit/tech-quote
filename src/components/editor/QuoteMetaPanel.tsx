"use client";

import type { QuoteStatus } from "@/lib/types";

interface QuoteMetaPanelProps {
  quoteNumber: string;
  date: string;
  status: QuoteStatus;
  vatPct: number;
  onChange: (patch: {
    quoteNumber?: string;
    date?: string;
    status?: QuoteStatus;
    vatPct?: number;
  }) => void;
}

const STATUSES: QuoteStatus[] = ["Draft", "Sent", "Approved", "Won"];

export default function QuoteMetaPanel({
  quoteNumber,
  date,
  status,
  vatPct,
  onChange,
}: QuoteMetaPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <label className="ui-label">Quote #</label>
          <input
            value={quoteNumber}
            onChange={(e) => onChange({ quoteNumber: e.target.value })}
            className="ui-input !font-medium"
          />
        </div>
        <div>
          <label className="ui-label">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onChange({ date: e.target.value })}
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Status</label>
          <select
            value={status}
            onChange={(e) => onChange({ status: e.target.value as QuoteStatus })}
            className="ui-input"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="ui-label">VAT %</label>
          <input
            type="number"
            step="0.01"
            value={vatPct * 100}
            onChange={(e) => onChange({ vatPct: (parseFloat(e.target.value) || 0) / 100 })}
            className="ui-input"
          />
        </div>
      </div>
  );
}
