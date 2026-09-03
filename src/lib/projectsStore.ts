"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { Project } from "./types";

const EMPTY_PROJECTS: Project[] = [];
const SAVE_DEBOUNCE_MS = 500;

type LoadState = "idle" | "loading" | "loaded" | "error";

let cache: Project[] = EMPTY_PROJECTS;
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
    const res = await fetch("/api/projects");
    if (!res.ok) throw new Error(`Failed to load projects (${res.status})`);
    const data = await res.json();
    cache = (data.projects ?? []) as Project[];
    loadState = "loaded";
  } catch (err) {
    console.error(err);
    loadState = "error";
  } finally {
    emit();
  }
}

function scheduleSave(project: Project) {
  const existing = saveTimers.get(project.id);
  if (existing) clearTimeout(existing);
  if (!pendingIds.has(project.id)) {
    pendingIds.add(project.id);
    emitStatus();
  }
  const timer = setTimeout(async () => {
    saveTimers.delete(project.id);
    try {
      const latest = cache.find((p) => p.id === project.id) ?? project;
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
    } catch (err) {
      console.error("Failed to save project", err);
    } finally {
      pendingIds.delete(project.id);
      emitStatus();
    }
  }, SAVE_DEBOUNCE_MS);
  saveTimers.set(project.id, timer);
}

export async function createProject(): Promise<Project> {
  const res = await fetch("/api/projects", { method: "POST" });
  if (!res.ok) throw new Error(`Failed to create project (${res.status})`);
  const data = await res.json();
  const project: Project = data.project;
  cache = [project, ...cache];
  emit();
  return project;
}

/** Insert or refresh a project in the local cache (e.g. after Mark as Won). */
export function upsertProjectInCache(project: Project) {
  const idx = cache.findIndex((p) => p.id === project.id);
  cache = idx === -1 ? [project, ...cache] : cache.map((p, n) => (n === idx ? project : p));
  emit();
}

export function getProjectByQuoteIdFromCache(quoteId: string): Project | undefined {
  return cache.find((p) => p.quoteId === quoteId);
}

export function updateProject(id: string, updater: (project: Project) => Project) {
  const idx = cache.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const updated = updater(cache[idx]);
  updated.updatedAt = new Date().toISOString();
  cache = cache.map((p, n) => (n === idx ? updated : p));
  emit();
  scheduleSave(updated);
}

export function deleteProject(id: string) {
  cache = cache.filter((p) => p.id !== id);
  emit();
  const timer = saveTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    saveTimers.delete(id);
    pendingIds.delete(id);
    emitStatus();
  }
  fetch(`/api/projects/${id}`, { method: "DELETE" }).catch((err) => {
    console.error("Failed to delete project", err);
  });
}

export function useProjects(): Project[] {
  useEffect(() => {
    ensureLoaded();
  }, []);
  return useSyncExternalStore(subscribe, () => cache, () => EMPTY_PROJECTS);
}

export function useProject(id: string | undefined): Project | undefined {
  useEffect(() => {
    ensureLoaded();
  }, []);
  const getSnapshot = useCallback(() => cache.find((p) => p.id === id), [id]);
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}

export function useProjectsLoadState(): LoadState {
  useEffect(() => {
    ensureLoaded();
  }, []);
  return useSyncExternalStore(subscribe, () => loadState, () => "loading" as LoadState);
}

export function useProjectsSavingStatus(): boolean {
  return useSyncExternalStore(subscribeStatus, () => pendingIds.size > 0, () => false);
}
