"use client";

import { useState } from "react";
import { useRecentClients } from "@/lib/store";
import type { Client } from "@/lib/types";

interface ClientPanelProps {
  client: Client;
  onChange: (patch: Partial<Client>) => void;
}

export default function ClientPanel({ client, onChange }: ClientPanelProps) {
  const recentClients = useRecentClients();
  const [showRecent, setShowRecent] = useState(false);

  return (
    <div>
      {recentClients.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowRecent((v) => !v)}
            className="text-xs font-semibold text-[var(--brand)] hover:underline"
          >
            Recent clients
          </button>
        </div>
      )}

      {showRecent && (
        <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-[var(--line)]">
          {recentClients.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange(c);
                setShowRecent(false);
              }}
              className="block w-full border-b border-[var(--line-soft)] px-3 py-2.5 text-left text-[13px] last:border-b-0 hover:bg-[var(--surface-hover)]"
            >
              <div className="font-semibold text-[var(--ink-900)]">{c.name}</div>
              <div className="text-xs text-[var(--ink-500)]">
                {c.office}
                {c.office && c.address ? " · " : ""}
                {c.address}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3.5">
        <div>
          <label className="ui-label">Contact Person</label>
          <input
            value={client.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Contact person name"
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Office / Department</label>
          <input
            value={client.office}
            onChange={(e) => onChange({ office: e.target.value })}
            placeholder="Office or department"
            className="ui-input"
          />
        </div>
        <div>
          <label className="ui-label">Address</label>
          <input
            value={client.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="Address"
            className="ui-input"
          />
        </div>
      </div>
    </div>
  );
}
