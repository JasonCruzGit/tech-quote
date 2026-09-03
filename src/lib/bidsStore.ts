"use client";

import { createEntityStore } from "./createEntityStore";
import type { Bid, Project } from "./types";

const store = createEntityStore<Bid>({
  endpoint: "/api/bids",
  listKey: "bids",
  itemKey: "bid",
  label: "bid",
  compare: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
});

export const createBid = store.create;
export const updateBid = store.update;
export const deleteBid = store.remove;
export const useBids = store.useAll;
export const useBid = store.useOne;
export const useBidsLoadState = store.useLoadState;
export const useBidsSavingStatus = store.useSaving;

/** Marks a bid as won and opens the delivery project with its document checklist. */
export async function awardBid(
  bidId: string
): Promise<{ project: Project; bid: Bid; alreadyExists: boolean }> {
  const res = await fetch(`/api/bids/${bidId}/award`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to award bid (${res.status})`);
  const data = (await res.json()) as {
    project: Project;
    bid: Bid;
    alreadyExists: boolean;
  };
  store.upsert(data.bid);
  return data;
}
