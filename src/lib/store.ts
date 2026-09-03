"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { Client, Project, Quote } from "./types";
import type { QuoteImportRow } from "./quoteImport";

const EMPTY_QUOTES: Quote[] = [];
const EMPTY_CLIENTS: Client[] = [];
const SAVE_DEBOUNCE_MS = 500;

type LoadState = "idle" | "loading" | "loaded" | "error";

interface StoreShape {
  quotes: Quote[];
  recentClients: Client[];
}

let cache: StoreShape = { quotes: EMPTY_QUOTES, recentClients: EMPTY_CLIENTS };
let quotesLoadState: LoadState = "idle";
let clientsLoadState: LoadState = "idle";

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingIds = new Set<string>();

const listeners = new Set<() => void>();
const statusListeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function emitStatus() {
  for (const l of statusListeners) l();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function subscribeStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

async function ensureQuotesLoaded() {
  if (quotesLoadState !== "idle") return;
  quotesLoadState = "loading";
  try {
    const res = await fetch("/api/quotes");
    if (!res.ok) throw new Error(`Failed to load quotes (${res.status})`);
    const data = await res.json();
    cache = { ...cache, quotes: (data.quotes ?? []) as Quote[] };
    quotesLoadState = "loaded";
  } catch (err) {
    console.error(err);
    quotesLoadState = "error";
  } finally {
    emit();
  }
}

async function ensureRecentClientsLoaded() {
  if (clientsLoadState !== "idle") return;
  clientsLoadState = "loading";
  try {
    const res = await fetch("/api/clients/recent");
    if (!res.ok) throw new Error(`Failed to load clients (${res.status})`);
    const data = await res.json();
    cache = { ...cache, recentClients: (data.clients ?? []) as Client[] };
    clientsLoadState = "loaded";
  } catch (err) {
    console.error(err);
    clientsLoadState = "error";
  } finally {
    emit();
  }
}

function scheduleSave(quote: Quote) {
  const existingTimer = saveTimers.get(quote.id);
  if (existingTimer) clearTimeout(existingTimer);

  if (!pendingIds.has(quote.id)) {
    pendingIds.add(quote.id);
    emitStatus();
  }

  const timer = setTimeout(async () => {
    saveTimers.delete(quote.id);
    try {
      const latest = cache.quotes.find((q) => q.id === quote.id) ?? quote;
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
    } catch (err) {
      console.error("Failed to save quote", err);
    } finally {
      pendingIds.delete(quote.id);
      emitStatus();
    }
  }, SAVE_DEBOUNCE_MS);

  saveTimers.set(quote.id, timer);
}

export function getQuotesLoadState(): LoadState {
  return quotesLoadState;
}

export async function createQuote(): Promise<Quote> {
  const res = await fetch("/api/quotes", { method: "POST" });
  if (!res.ok) throw new Error(`Failed to create quote (${res.status})`);
  const data = await res.json();
  const quote: Quote = data.quote;
  cache = { ...cache, quotes: [quote, ...cache.quotes] };
  emit();
  return quote;
}

export async function importQuotes(
  rows: QuoteImportRow[]
): Promise<{ imported: Quote[]; skipped: number; messages: string[] }> {
  const res = await fetch("/api/quotes/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) throw new Error(`Failed to import quotations (${res.status})`);
  const data = (await res.json()) as {
    imported: Quote[];
    skipped: number;
    messages: string[];
  };
  if (data.imported.length > 0) {
    cache = { ...cache, quotes: [...data.imported, ...cache.quotes] };
    emit();
  }
  return data;
}

export async function duplicateQuote(id: string): Promise<Quote | undefined> {
  const res = await fetch(`/api/quotes/${id}/duplicate`, { method: "POST" });
  if (!res.ok) return undefined;
  const data = await res.json();
  const quote: Quote = data.quote;
  cache = { ...cache, quotes: [quote, ...cache.quotes] };
  emit();
  return quote;
}

/** Mark a quotation as Won and create (or return) its linked project. */
export async function markQuoteWon(id: string): Promise<{ quote: Quote; project: Project }> {
  const res = await fetch(`/api/quotes/${id}/won`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to mark quote as won (${res.status})`);
  const data = await res.json();
  const quote: Quote = data.quote;
  const project: Project = data.project;

  const idx = cache.quotes.findIndex((q) => q.id === quote.id);
  cache = {
    ...cache,
    quotes:
      idx === -1
        ? [quote, ...cache.quotes]
        : cache.quotes.map((q, i) => (i === idx ? quote : q)),
  };
  emit();
  return { quote, project };
}

function clearPendingSave(id: string) {
  const timer = saveTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    saveTimers.delete(id);
  }
  if (pendingIds.delete(id)) emitStatus();
}

/**
 * Persist editor changes as a new quotation with an auto-incremented control number,
 * restoring the opened original so it stays unchanged. Blank brand-new quotes save in place.
 */
export async function saveQuoteAsNew(
  sourceId: string,
  draft: Quote,
  restore: Quote
): Promise<{ quote: Quote; mode: "new" | "inplace" }> {
  clearPendingSave(sourceId);

  const res = await fetch(`/api/quotes/${sourceId}/save-as-new`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, restore }),
  });
  if (!res.ok) throw new Error(`Failed to save as new (${res.status})`);

  const data = (await res.json()) as {
    quote: Quote;
    restored?: Quote;
    mode: "new" | "inplace";
  };

  if (data.mode === "inplace") {
    const idx = cache.quotes.findIndex((q) => q.id === sourceId);
    cache = {
      ...cache,
      quotes:
        idx === -1
          ? [data.quote, ...cache.quotes]
          : cache.quotes.map((q, i) => (i === idx ? data.quote : q)),
    };
  } else {
    const restored = data.restored ?? restore;
    const withoutDraft = cache.quotes.filter((q) => q.id !== data.quote.id);
    const idx = withoutDraft.findIndex((q) => q.id === sourceId);
    const withRestored =
      idx === -1
        ? [restored, ...withoutDraft]
        : withoutDraft.map((q, i) => (i === idx ? restored : q));
    cache = { ...cache, quotes: [data.quote, ...withRestored] };
  }

  emit();
  return { quote: data.quote, mode: data.mode };
}

export function updateQuote(id: string, updater: (quote: Quote) => Quote) {
  const idx = cache.quotes.findIndex((q) => q.id === id);
  if (idx === -1) return;

  const updated = updater(cache.quotes[idx]);
  updated.updatedAt = new Date().toISOString();
  const nextQuotes = cache.quotes.map((q, i) => (i === idx ? updated : q));
  cache = { ...cache, quotes: nextQuotes };

  if (updated.client.name.trim()) {
    const key = updated.client.name.trim().toLowerCase();
    const others = cache.recentClients.filter((c) => c.name.trim().toLowerCase() !== key);
    cache = { ...cache, recentClients: [updated.client, ...others].slice(0, 12) };
  }

  emit();
  scheduleSave(updated);
}

export function deleteQuote(id: string) {
  cache = { ...cache, quotes: cache.quotes.filter((q) => q.id !== id) };
  emit();

  const timer = saveTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    saveTimers.delete(id);
    pendingIds.delete(id);
    emitStatus();
  }

  fetch(`/api/quotes/${id}`, { method: "DELETE" }).catch((err) => {
    console.error("Failed to delete quote", err);
  });
}

export function useQuotes(): Quote[] {
  useEffect(() => {
    ensureQuotesLoaded();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => cache.quotes,
    () => EMPTY_QUOTES
  );
}

export function useQuote(id: string | undefined): Quote | undefined {
  useEffect(() => {
    ensureQuotesLoaded();
  }, []);
  const getSnapshot = useCallback(() => cache.quotes.find((q) => q.id === id), [id]);
  const getServerSnapshot = useCallback(() => undefined, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useQuotesLoadState(): LoadState {
  useEffect(() => {
    ensureQuotesLoaded();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => quotesLoadState,
    () => "loading" as LoadState
  );
}

export function useRecentClients(): Client[] {
  useEffect(() => {
    ensureRecentClientsLoaded();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => cache.recentClients,
    () => EMPTY_CLIENTS
  );
}

export function useSavingStatus(): boolean {
  return useSyncExternalStore(
    subscribeStatus,
    () => pendingIds.size > 0,
    () => false
  );
}
