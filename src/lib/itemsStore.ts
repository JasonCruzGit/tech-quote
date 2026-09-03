"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { CatalogItem } from "./types";

const EMPTY_ITEMS: CatalogItem[] = [];
const SAVE_DEBOUNCE_MS = 500;

type LoadState = "idle" | "loading" | "loaded" | "error";

let cache: CatalogItem[] = EMPTY_ITEMS;
let loadState: LoadState = "idle";
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

async function ensureLoaded() {
  if (loadState !== "idle") return;
  loadState = "loading";
  try {
    const res = await fetch("/api/items");
    if (!res.ok) throw new Error(`Failed to load items (${res.status})`);
    const data = await res.json();
    cache = (data.items ?? []) as CatalogItem[];
    loadState = "loaded";
  } catch (err) {
    console.error(err);
    loadState = "error";
  } finally {
    emit();
  }
}

function scheduleSave(item: CatalogItem) {
  const existing = saveTimers.get(item.id);
  if (existing) clearTimeout(existing);
  if (!pendingIds.has(item.id)) {
    pendingIds.add(item.id);
    emitStatus();
  }
  const timer = setTimeout(async () => {
    saveTimers.delete(item.id);
    try {
      const latest = cache.find((i) => i.id === item.id) ?? item;
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
    } catch (err) {
      console.error("Failed to save item", err);
    } finally {
      pendingIds.delete(item.id);
      emitStatus();
    }
  }, SAVE_DEBOUNCE_MS);
  saveTimers.set(item.id, timer);
}

export async function createCatalogItem(): Promise<CatalogItem> {
  const res = await fetch("/api/items", { method: "POST" });
  if (!res.ok) throw new Error(`Failed to create item (${res.status})`);
  const data = await res.json();
  const item: CatalogItem = data.item;
  cache = [item, ...cache];
  emit();
  return item;
}

export function updateCatalogItem(id: string, updater: (item: CatalogItem) => CatalogItem) {
  const idx = cache.findIndex((i) => i.id === id);
  if (idx === -1) return;
  const updated = updater(cache[idx]);
  updated.updatedAt = new Date().toISOString();
  cache = cache.map((i, n) => (n === idx ? updated : i));
  emit();
  scheduleSave(updated);
}

export function deleteCatalogItem(id: string) {
  cache = cache.filter((i) => i.id !== id);
  emit();
  const timer = saveTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    saveTimers.delete(id);
    pendingIds.delete(id);
    emitStatus();
  }
  fetch(`/api/items/${id}`, { method: "DELETE" }).catch((err) => {
    console.error("Failed to delete item", err);
  });
}

export function useCatalogItems(): CatalogItem[] {
  useEffect(() => {
    ensureLoaded();
  }, []);
  return useSyncExternalStore(subscribe, () => cache, () => EMPTY_ITEMS);
}

export function useCatalogItem(id: string | undefined): CatalogItem | undefined {
  useEffect(() => {
    ensureLoaded();
  }, []);
  const getSnapshot = useCallback(() => cache.find((i) => i.id === id), [id]);
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}

export function useCatalogItemsLoadState(): LoadState {
  useEffect(() => {
    ensureLoaded();
  }, []);
  return useSyncExternalStore(subscribe, () => loadState, () => "loading" as LoadState);
}

export function useCatalogSavingStatus(): boolean {
  return useSyncExternalStore(subscribeStatus, () => pendingIds.size > 0, () => false);
}
