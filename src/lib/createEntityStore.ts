"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type LoadState = "idle" | "loading" | "loaded" | "error";

interface Entity {
  id: string;
  updatedAt: string;
}

interface StoreConfig<T> {
  /** Collection endpoint, e.g. "/api/rfqs" */
  endpoint: string;
  /** Key holding the array in the list response, e.g. "rfqs" */
  listKey: string;
  /** Key holding the record in a create response, e.g. "rfq" */
  itemKey: string;
  /** Human label used in error messages */
  label: string;
  /** Optional query string appended when loading, e.g. "?projectId=x" */
  buildListUrl?: () => string;
  /** Sorts the cache after load and insert */
  compare?: (a: T, b: T) => number;
}

const SAVE_DEBOUNCE_MS = 500;

/**
 * Builds a client-side store with optimistic updates and debounced autosave,
 * matching the behaviour of the quotes and projects stores.
 */
export function createEntityStore<T extends Entity>(config: StoreConfig<T>) {
  const EMPTY: T[] = [];

  let cache: T[] = EMPTY;
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

  function sorted(rows: T[]): T[] {
    return config.compare ? [...rows].sort(config.compare) : rows;
  }

  async function ensureLoaded() {
    if (loadState !== "idle") return;
    loadState = "loading";
    try {
      const url = config.buildListUrl ? config.buildListUrl() : config.endpoint;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load ${config.label} (${res.status})`);
      const data = await res.json();
      cache = sorted((data[config.listKey] ?? []) as T[]);
      loadState = "loaded";
    } catch (err) {
      console.error(err);
      loadState = "error";
    } finally {
      emit();
    }
  }

  /** Discards the cache so the next hook mount refetches. */
  function invalidate() {
    loadState = "idle";
    cache = EMPTY;
    emit();
  }

  function scheduleSave(id: string) {
    const existing = saveTimers.get(id);
    if (existing) clearTimeout(existing);
    if (!pendingIds.has(id)) {
      pendingIds.add(id);
      emitStatus();
    }
    const timer = setTimeout(async () => {
      saveTimers.delete(id);
      try {
        const latest = cache.find((row) => row.id === id);
        if (!latest) return;
        const res = await fetch(`${config.endpoint}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(latest),
        });
        if (!res.ok) throw new Error(`Save failed (${res.status})`);
      } catch (err) {
        console.error(`Failed to save ${config.label}`, err);
      } finally {
        pendingIds.delete(id);
        emitStatus();
      }
    }, SAVE_DEBOUNCE_MS);
    saveTimers.set(id, timer);
  }

  async function create(seed?: Record<string, unknown>): Promise<T> {
    const res = await fetch(config.endpoint, {
      method: "POST",
      headers: seed ? { "Content-Type": "application/json" } : undefined,
      body: seed ? JSON.stringify(seed) : undefined,
    });
    if (!res.ok) throw new Error(`Failed to create ${config.label} (${res.status})`);
    const data = await res.json();
    const created = data[config.itemKey] as T;
    cache = sorted([created, ...cache]);
    emit();
    return created;
  }

  function upsert(row: T) {
    const idx = cache.findIndex((r) => r.id === row.id);
    cache = sorted(
      idx === -1 ? [row, ...cache] : cache.map((r, n) => (n === idx ? row : r))
    );
    emit();
  }

  function update(id: string, updater: (row: T) => T) {
    const idx = cache.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const updated = { ...updater(cache[idx]), updatedAt: new Date().toISOString() };
    cache = cache.map((r, n) => (n === idx ? updated : r));
    emit();
    scheduleSave(id);
  }

  function remove(id: string) {
    cache = cache.filter((r) => r.id !== id);
    emit();
    const timer = saveTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      saveTimers.delete(id);
      pendingIds.delete(id);
      emitStatus();
    }
    fetch(`${config.endpoint}/${id}`, { method: "DELETE" }).catch((err) => {
      console.error(`Failed to delete ${config.label}`, err);
    });
  }

  function useAll(): T[] {
    useEffect(() => {
      ensureLoaded();
    }, []);
    return useSyncExternalStore(
      subscribe,
      () => cache,
      () => EMPTY
    );
  }

  function useOne(id: string | undefined): T | undefined {
    useEffect(() => {
      ensureLoaded();
    }, []);
    const getSnapshot = useCallback(() => cache.find((r) => r.id === id), [id]);
    return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
  }

  function useLoadState(): LoadState {
    useEffect(() => {
      ensureLoaded();
    }, []);
    return useSyncExternalStore(
      subscribe,
      () => loadState,
      () => "loading" as LoadState
    );
  }

  function useSaving(): boolean {
    return useSyncExternalStore(
      subscribeStatus,
      () => pendingIds.size > 0,
      () => false
    );
  }

  return {
    create,
    update,
    remove,
    upsert,
    invalidate,
    useAll,
    useOne,
    useLoadState,
    useSaving,
  };
}
