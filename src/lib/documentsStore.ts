"use client";

import { createEntityStore } from "./createEntityStore";
import type { DocumentCategory, ProjectDocument } from "./types";

const store = createEntityStore<ProjectDocument>({
  endpoint: "/api/documents",
  listKey: "documents",
  itemKey: "document",
  label: "document",
  compare: (a, b) =>
    a.projectId === b.projectId
      ? a.sortOrder - b.sortOrder
      : a.projectId.localeCompare(b.projectId),
});

export const updateDocument = store.update;
export const deleteDocument = store.remove;
export const useDocuments = store.useAll;
export const useDocumentsLoadState = store.useLoadState;
export const useDocumentsSavingStatus = store.useSaving;

export function createDocument(projectId: string) {
  return store.create({ projectId, name: "", category: "Other" });
}

/** Upload one or more files as project documents. */
export async function uploadProjectDocuments(
  projectId: string,
  files: File[],
  options?: { category?: DocumentCategory; documentId?: string }
): Promise<ProjectDocument[]> {
  const form = new FormData();
  form.set("projectId", projectId);
  if (options?.category) form.set("category", options.category);
  if (options?.documentId) form.set("documentId", options.documentId);
  for (const file of files) form.append("files", file);

  const res = await fetch("/api/documents/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { documents: ProjectDocument[] };
  for (const doc of data.documents) store.upsert(doc);
  return data.documents;
}

/** Applies the default checklist to a project that has no documents yet. */
export async function seedProjectDocuments(
  projectId: string
): Promise<ProjectDocument[]> {
  const res = await fetch("/api/documents/seed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) throw new Error(`Failed to create checklist (${res.status})`);
  const data = (await res.json()) as { documents: ProjectDocument[] };
  for (const doc of data.documents) store.upsert(doc);
  return data.documents;
}

/** Completion ratio for a project's checklist, ignoring non-applicable rows. */
export function documentProgress(docs: ProjectDocument[]): {
  done: number;
  total: number;
  pct: number;
  attached: number;
} {
  const applicable = docs.filter((d) => d.status !== "Not applicable");
  const attached = docs.filter((d) => Boolean(d.storedName)).length;
  const done = applicable.filter(
    (d) => d.status === "Approved" || d.status === "Submitted" || Boolean(d.storedName)
  ).length;
  const total = applicable.length;
  return {
    done,
    total,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
    attached,
  };
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
