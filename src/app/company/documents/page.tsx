"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import ListPageChrome from "@/components/ui/ListPageChrome";
import SortableTh from "@/components/ui/SortableTh";
import StatStrip, { type Stat } from "@/components/ui/StatStrip";
import { SearchInput } from "@/components/ui/Toolbar";
import {
  companyDocumentExpiryLabel,
  companyDocumentExpiryStatus,
  daysUntilExpiry,
  EXPIRY_CRITICAL_DAYS,
  EXPIRY_WARNING_DAYS,
  summarizeCompanyDocumentAlerts,
} from "@/lib/companyDocumentExpiry";
import {
  deleteCompanyDocument,
  formatFileSize,
  updateCompanyDocument,
  uploadCompanyDocuments,
  useCompanyDocuments,
  useCompanyDocumentsLoadState,
} from "@/lib/companyDocumentsStore";
import { formatDateLong } from "@/lib/format";
import { useTableSort } from "@/lib/useTableSort";
import {
  COMPANY_DOCUMENT_CATEGORIES,
  type CompanyDocument,
  type CompanyDocumentCategory,
  type CompanyDocumentExpiryStatus,
} from "@/lib/types";

type SortKey = "name" | "category" | "expiresOn" | "updatedAt" | "status";

function expiryBadgeClass(status: CompanyDocumentExpiryStatus): string {
  switch (status) {
    case "expired":
      return "bg-[#fef3f2] text-[#b42318] ring-[#fecdca]";
    case "critical":
      return "bg-[#fff6ed] text-[#c4320a] ring-[#f9dbaf]";
    case "warning":
      return "bg-[#fffaeb] text-[#b54708] ring-[#fedf89]";
    case "ok":
      return "bg-[#ecfdf3] text-[#027a48] ring-[#abefc6]";
    default:
      return "bg-[var(--surface-sub)] text-[var(--ink-500)] ring-[var(--line)]";
  }
}

export default function CompanyDocumentsPage() {
  const documents = useCompanyDocuments();
  const loadState = useCompanyDocumentsLoadState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CompanyDocumentCategory>("Permit / License");
  const [expiresOn, setExpiresOn] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const alerts = useMemo(() => summarizeCompanyDocumentAlerts(documents), [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (!q) return true;
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.notes.toLowerCase().includes(q)
      );
    });
  }, [documents, query]);

  const { sorted, sort, toggle } = useTableSort<CompanyDocument, SortKey>(
    filtered,
    (doc, key) => {
      switch (key) {
        case "name":
          return doc.name;
        case "category":
          return doc.category;
        case "expiresOn":
          return doc.expiresOn || null;
        case "updatedAt":
          return doc.updatedAt;
        case "status": {
          const days = daysUntilExpiry(doc.expiresOn);
          if (days === null) return Number.POSITIVE_INFINITY;
          return days;
        }
      }
    },
    { key: "status", dir: "asc" }
  );

  const stats: Stat[] = useMemo(
    () => [
      { label: "Documents", value: String(documents.length) },
      { label: "Expired", value: String(alerts.expired) },
      { label: `Due ≤ ${EXPIRY_CRITICAL_DAYS}d`, value: String(alerts.critical) },
      { label: `Due ≤ ${EXPIRY_WARNING_DAYS}d`, value: String(alerts.warning) },
    ],
    [documents.length, alerts]
  );

  function resetUploadForm() {
    setName("");
    setCategory("Permit / License");
    setExpiresOn("");
    setNotes("");
    setFiles([]);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setUploadError("Choose at least one file to upload.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      await uploadCompanyDocuments(files, {
        name: name.trim() || undefined,
        category,
        expiresOn,
        notes,
      });
      resetUploadForm();
      setShowUpload(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: CompanyDocument) {
    if (!window.confirm(`Delete “${doc.name}”? This cannot be undone.`)) return;
    deleteCompanyDocument(doc.id);
  }

  function patchExpiry(doc: CompanyDocument, nextExpiresOn: string) {
    updateCompanyDocument(doc.id, (current) => ({
      ...current,
      expiresOn: nextExpiresOn,
    }));
  }

  return (
    <AppShell>
      <ListPageChrome
        title="Company Documents"
        description="Central files for Techcentrix — permits, templates, policies, and shared references."
        toolbar={
          <button
            type="button"
            className="ui-btn ui-btn-primary"
            onClick={() => setShowUpload((v) => !v)}
          >
            {showUpload ? "Cancel upload" : "Upload document"}
          </button>
        }
        stats={<StatStrip stats={stats} />}
        filters={
          <div className="mb-4 space-y-3">
            {alerts.total > 0 ? (
              <div className="rounded-xl border border-[#f9dbaf] bg-[#fff6ed] px-4 py-3 text-sm text-[#9a3412]">
                <p className="font-semibold">Expiration alerts</p>
                <p className="mt-0.5 text-[13px] leading-relaxed">
                  {alerts.expired > 0
                    ? `${alerts.expired} expired · `
                    : null}
                  {alerts.critical > 0
                    ? `${alerts.critical} due within ${EXPIRY_CRITICAL_DAYS} days · `
                    : null}
                  {alerts.warning > 0
                    ? `${alerts.warning} due within ${EXPIRY_WARNING_DAYS} days`
                    : null}
                  . Renew or replace these files soon.
                </p>
              </div>
            ) : null}

            {showUpload ? (
              <form
                onSubmit={(e) => void handleUpload(e)}
                className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm"
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="ui-label" htmlFor="company-doc-name">
                      Display name
                    </label>
                    <input
                      id="company-doc-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Optional — defaults to file name"
                      className="ui-input"
                    />
                  </div>
                  <div>
                    <label className="ui-label" htmlFor="company-doc-category">
                      Category
                    </label>
                    <select
                      id="company-doc-category"
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as CompanyDocumentCategory)
                      }
                      className="ui-input"
                    >
                      {COMPANY_DOCUMENT_CATEGORIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="ui-label" htmlFor="company-doc-expires">
                      Expiration date
                    </label>
                    <input
                      id="company-doc-expires"
                      type="date"
                      value={expiresOn}
                      onChange={(e) => setExpiresOn(e.target.value)}
                      className="ui-input"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="ui-label" htmlFor="company-doc-notes">
                      Notes
                    </label>
                    <input
                      id="company-doc-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes"
                      className="ui-input"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="ui-label" htmlFor="company-doc-files">
                      Files
                    </label>
                    <input
                      id="company-doc-files"
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                      className="block w-full text-sm text-[var(--ink-600)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                    {files.length > 0 ? (
                      <p className="mt-1.5 text-xs text-[var(--ink-500)]">
                        {files.length} file{files.length === 1 ? "" : "s"} selected
                      </p>
                    ) : null}
                  </div>
                </div>
                {uploadError ? (
                  <p className="mt-3 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-[13px] font-medium text-[#b42318]">
                    {uploadError}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="ui-btn ui-btn-primary"
                  >
                    {uploading ? "Uploading…" : "Upload"}
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn-ghost"
                    onClick={() => {
                      resetUploadForm();
                      setShowUpload(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search company documents…"
            />
          </div>
        }
        cardMeta={
          <span className="ui-card-meta">
            {sorted.length} file{sorted.length === 1 ? "" : "s"}
          </span>
        }
      >
        {loadState === "loading" || loadState === "idle" ? (
          <div className="px-6 py-16 text-center text-sm text-[var(--ink-400)]">
            Loading documents…
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            title={query ? "No matching documents" : "No company documents yet"}
            description={
              query
                ? "Try a different search."
                : "Upload company-wide files and set an expiration date to get renewal alerts."
            }
            action={
              !query ? (
                <button
                  type="button"
                  className="ui-btn ui-btn-primary"
                  onClick={() => setShowUpload(true)}
                >
                  Upload document
                </button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ui-table">
              <thead>
                <tr>
                  <SortableTh columnKey="name" label="Document" sort={sort} onSort={toggle} />
                  <SortableTh
                    columnKey="category"
                    label="Category"
                    sort={sort}
                    onSort={toggle}
                  />
                  <SortableTh
                    columnKey="expiresOn"
                    label="Expires"
                    sort={sort}
                    onSort={toggle}
                  />
                  <SortableTh columnKey="status" label="Alert" sort={sort} onSort={toggle} />
                  <SortableTh
                    columnKey="updatedAt"
                    label="Updated"
                    sort={sort}
                    onSort={toggle}
                  />
                  <th className="ui-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((doc) => {
                  const status = companyDocumentExpiryStatus(doc.expiresOn);
                  const days = daysUntilExpiry(doc.expiresOn);
                  return (
                    <tr key={doc.id} className="ui-tr">
                      <td className="ui-td">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink-900)]">
                            {doc.name}
                          </p>
                          <p className="truncate text-xs text-[var(--ink-400)]">
                            {doc.fileName || "No file"}
                            {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="ui-td text-sm text-[var(--ink-700)]">{doc.category}</td>
                      <td className="ui-td">
                        <input
                          type="date"
                          value={doc.expiresOn}
                          onChange={(e) => patchExpiry(doc, e.target.value)}
                          className="ui-input ui-input-compact max-w-[10.5rem]"
                          aria-label={`Expiration date for ${doc.name}`}
                        />
                      </td>
                      <td className="ui-td">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${expiryBadgeClass(status)}`}
                        >
                          {companyDocumentExpiryLabel(status, days)}
                        </span>
                      </td>
                      <td className="ui-td text-sm text-[var(--ink-500)]">
                        {formatDateLong(doc.updatedAt.slice(0, 10))}
                      </td>
                      <td className="ui-td">
                        <div className="flex justify-end gap-1.5">
                          {doc.storedName ? (
                            <a
                              href={`/api/company-documents/${doc.id}/file`}
                              target="_blank"
                              rel="noreferrer"
                              className="ui-btn ui-btn-sm ui-btn-ghost"
                            >
                              View
                            </a>
                          ) : null}
                          <button
                            type="button"
                            className="ui-btn ui-btn-sm ui-btn-danger"
                            onClick={() => handleDelete(doc)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ListPageChrome>
    </AppShell>
  );
}
