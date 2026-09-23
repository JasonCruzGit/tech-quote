"use client";

import { createEntityStore } from "./createEntityStore";
import { formatFileSize } from "./documentsStore";
import type { CompanyDocument, CompanyDocumentCategory } from "./types";

const store = createEntityStore<CompanyDocument>({
  endpoint: "/api/company-documents",
  listKey: "documents",
  itemKey: "document",
  label: "company document",
  compare: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
});

export const updateCompanyDocument = store.update;
export const deleteCompanyDocument = store.remove;
export const useCompanyDocuments = store.useAll;
export const useCompanyDocumentsLoadState = store.useLoadState;
export const useCompanyDocumentsSavingStatus = store.useSaving;
export { formatFileSize };

export async function uploadCompanyDocuments(
  files: File[],
  options?: {
    category?: CompanyDocumentCategory;
    expiresOn?: string;
    notes?: string;
    name?: string;
    documentId?: string;
  }
): Promise<CompanyDocument[]> {
  const form = new FormData();
  if (options?.category) form.set("category", options.category);
  if (options?.expiresOn) form.set("expiresOn", options.expiresOn);
  if (options?.notes) form.set("notes", options.notes);
  if (options?.name) form.set("name", options.name);
  if (options?.documentId) form.set("documentId", options.documentId);
  for (const file of files) form.append("files", file);

  const res = await fetch("/api/company-documents/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { documents: CompanyDocument[] };
  for (const doc of data.documents) store.upsert(doc);
  return data.documents;
}
