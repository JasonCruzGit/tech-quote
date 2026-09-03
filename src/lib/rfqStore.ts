"use client";

import { createEntityStore } from "./createEntityStore";
import type { Quote, Rfq } from "./types";

const store = createEntityStore<Rfq>({
  endpoint: "/api/rfqs",
  listKey: "rfqs",
  itemKey: "rfq",
  label: "RFQ",
  compare: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
});

export const createRfq = store.create;
export const updateRfq = store.update;
export const deleteRfq = store.remove;
export const useRfqs = store.useAll;
export const useRfq = store.useOne;
export const useRfqsLoadState = store.useLoadState;
export const useRfqsSavingStatus = store.useSaving;

/** Creates the quotation for an RFQ and links the two records together. */
export async function convertRfqToQuote(
  rfqId: string
): Promise<{ quote: Quote; rfq: Rfq; alreadyExists: boolean }> {
  const res = await fetch(`/api/rfqs/${rfqId}/quote`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to create quotation (${res.status})`);
  const data = (await res.json()) as {
    quote: Quote;
    rfq: Rfq;
    alreadyExists: boolean;
  };
  store.upsert(data.rfq);
  return data;
}
