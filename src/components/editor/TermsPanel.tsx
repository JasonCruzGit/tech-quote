"use client";

import type { Terms } from "@/lib/types";

interface TermsPanelProps {
  terms: Terms;
  onChange: (patch: Partial<Terms>) => void;
}

export default function TermsPanel({ terms, onChange }: TermsPanelProps) {
  return (
    <div className="space-y-3.5">
        <div>
          <label className="ui-label">Delivery</label>
          <input
            value={terms.delivery}
            onChange={(e) => onChange({ delivery: e.target.value })}
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Payment</label>
          <input
            value={terms.payment}
            onChange={(e) => onChange({ payment: e.target.value })}
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Warranty</label>
          <input
            value={terms.warranty}
            onChange={(e) => onChange({ warranty: e.target.value })}
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Prices note</label>
          <input
            value={terms.pricesNote}
            onChange={(e) => onChange({ pricesNote: e.target.value })}
            className="ui-input"
          />
        </div>
      </div>
  );
}
