"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState, type DragEvent } from "react";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import { UploadIcon } from "@/components/ui/Icons";
import PageHeader from "@/components/ui/PageHeader";
import RecordNotFound from "@/components/ui/RecordNotFound";
import SaveIndicator from "@/components/ui/SaveIndicator";
import SectionCard from "@/components/ui/SectionCard";
import {
  deleteDocument,
  documentProgress,
  formatFileSize,
  seedProjectDocuments,
  updateDocument,
  uploadProjectDocuments,
  useDocuments,
  useDocumentsLoadState,
  useDocumentsSavingStatus,
} from "@/lib/documentsStore";
import {
  updateProject,
  useProject,
  useProjectsLoadState,
  useProjectsSavingStatus,
} from "@/lib/projectsStore";
import {
  DOCUMENT_CATEGORIES,
  QUOTATION_RFQ_DOCUMENT_CATEGORY,
  type DocumentCategory,
  type ProjectDocument,
} from "@/lib/types";

function DocumentCard({
  doc,
  onAttach,
  uploading,
}: {
  doc: ProjectDocument;
  onAttach: (docId: string, files: FileList | null) => void;
  uploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(doc.storedName);

  function patch(partial: Partial<ProjectDocument>) {
    updateDocument(doc.id, (d) => ({ ...d, ...partial }));
  }

  function handleDelete() {
    const label = doc.name.trim() || doc.fileName || "this document";
    if (window.confirm(`Remove "${label}" from this project?`)) {
      deleteDocument(doc.id);
    }
  }

  return (
    <article className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
            hasFile
              ? "bg-[var(--brand-tint)] text-[var(--brand)]"
              : "bg-[var(--surface-sub)] text-[var(--ink-400)]"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M4.5 2.5h5.2L12.5 5.3V13.5A1 1 0 0111.5 14.5H4.5A1 1 0 013.5 13.5v-11A1 1 0 014.5 2.5z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M9 2.8V5.5H11.7"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={doc.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Document name"
            className="ui-input !h-auto !border-transparent !bg-transparent !px-0 !py-0.5 !text-sm !font-semibold hover:!bg-[var(--surface-hover)] focus:!border-[var(--brand)] focus:!bg-white focus:!px-2"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={doc.category}
              onChange={(e) => patch({ category: e.target.value as DocumentCategory })}
              className="ui-input ui-input-compact !w-auto min-w-[8.5rem]"
            >
              {DOCUMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {hasFile ? (
              <span className="ui-badge ui-badge-ok">Attached</span>
            ) : (
              <span className="ui-badge ui-badge-warn">No file</span>
            )}
          </div>
          {hasFile ? (
            <p className="truncate text-xs text-[var(--ink-500)]" title={doc.fileName}>
              {doc.fileName} · {formatFileSize(doc.fileSize)}
            </p>
          ) : (
            <p className="text-xs text-[var(--ink-400)]">
              Attach the paper or certification for this requirement.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
            onChange={(e) => {
              onAttach(doc.id, e.target.files);
              e.target.value = "";
            }}
          />
          {hasFile ? (
            <a
              href={`/api/documents/${doc.id}/file`}
              target="_blank"
              rel="noreferrer"
              className="ui-btn ui-btn-sm ui-btn-ghost"
            >
              Open
            </a>
          ) : null}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="ui-btn ui-btn-sm ui-btn-ghost"
          >
            {hasFile ? "Replace" : "Attach"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="ui-icon-btn ui-icon-btn-danger"
            aria-label={`Remove ${doc.name || "document"}`}
            title="Remove"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3 4h8M5.5 4V3h3v1M5 6.5v4M7 6.5v4M9 6.5v4M4 4l.5 7h5L10 4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ProjectDocumentationPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const project = useProject(projectId);
  const projectsLoad = useProjectsLoadState();
  const allDocuments = useDocuments();
  const docsLoad = useDocumentsLoadState();
  const docsSaving = useDocumentsSavingStatus();
  const projectsSaving = useProjectsSavingStatus();
  const isSaving = docsSaving || projectsSaving;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quotationFileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocumentCategory>("Other");
  const [isUploading, setIsUploading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const docs = useMemo(
    () =>
      allDocuments
        .filter((d) => d.projectId === projectId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [allDocuments, projectId]
  );

  const quotationDocs = useMemo(
    () => docs.filter((d) => d.category === QUOTATION_RFQ_DOCUMENT_CATEGORY),
    [docs]
  );

  const checklistDocs = useMemo(
    () => docs.filter((d) => d.category !== QUOTATION_RFQ_DOCUMENT_CATEGORY),
    [docs]
  );

  const grouped = useMemo(() => {
    const map = new Map<DocumentCategory, ProjectDocument[]>();
    for (const doc of checklistDocs) {
      const list = map.get(doc.category);
      if (list) list.push(doc);
      else map.set(doc.category, [doc]);
    }
    return DOCUMENT_CATEGORIES.filter((cat) => cat !== QUOTATION_RFQ_DOCUMENT_CATEGORY).flatMap(
      (cat) => {
        const list = map.get(cat);
        return list ? [[cat, list] as const] : [];
      }
    );
  }, [checklistDocs]);

  async function handleFiles(
    files: FileList | File[] | null,
    documentId?: string,
    uploadCategory?: DocumentCategory
  ) {
    if (!files || (Array.isArray(files) ? files.length === 0 : files.length === 0)) return;
    const list = Array.from(files);
    setIsUploading(true);
    try {
      await uploadProjectDocuments(projectId, list, {
        category: uploadCategory ?? category,
        documentId,
      });
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSeed() {
    setIsSeeding(true);
    try {
      await seedProjectDocuments(projectId);
    } catch (err) {
      console.error(err);
      window.alert("Failed to create the checklist. Please try again.");
    } finally {
      setIsSeeding(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  }

  if (!project) {
    return (
      <RecordNotFound
        isLoading={projectsLoad === "loading" || projectsLoad === "idle"}
        loadingLabel="Loading project…"
        missingLabel="Project not found. It may have been deleted."
        backHref="/projects/documentation"
        backLabel="Back to Documentation"
      />
    );
  }

  const progress = documentProgress(checklistDocs);
  const isLoading = docsLoad === "idle" || docsLoad === "loading";
  const attachedCount = progress.attached;

  function openQuotationUpload() {
    quotationFileInputRef.current?.click();
  }

  function patchProject(partial: Partial<NonNullable<typeof project>>) {
    if (!project) return;
    updateProject(project.id, (p) => ({ ...p, ...partial }));
  }

  return (
    <AppShell>
      <main className="ui-page">
        <div className="ui-page-inner">
          <PageHeader
            eyebrow="Documentation"
            title={
              <input
                value={project.name}
                onChange={(e) => patchProject({ name: e.target.value })}
                placeholder="Untitled project"
                aria-label="Project name"
                className="ui-input !h-auto !w-full max-w-xl !border-transparent !bg-transparent !px-0 !py-0.5 !text-[1.5rem] !font-semibold !tracking-tight hover:!bg-[var(--surface-hover)] focus:!border-[var(--brand)] focus:!bg-white focus:!px-2"
              />
            }
            subtitle={
              <div className="mt-1 flex max-w-xl flex-wrap gap-2">
                <input
                  value={project.clientName}
                  onChange={(e) => patchProject({ clientName: e.target.value })}
                  placeholder="Client contact"
                  aria-label="Client contact"
                  className="ui-input ui-input-compact min-w-[10rem] flex-1"
                />
                <input
                  value={project.clientOffice}
                  onChange={(e) => patchProject({ clientOffice: e.target.value })}
                  placeholder="Client office"
                  aria-label="Client office"
                  className="ui-input ui-input-compact min-w-[10rem] flex-1"
                />
              </div>
            }
            actions={
              <>
                <SaveIndicator isSaving={isSaving} />
                <Link href="/projects/documentation" className="ui-btn ui-btn-ghost">
                  Back
                </Link>
                <Link href={`/projects/${project.id}`} className="ui-btn ui-btn-ghost">
                  Open project
                </Link>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={openQuotationUpload}
                  className="ui-btn ui-btn-ghost"
                >
                  <UploadIcon size={13} />
                  Upload Quotation / RFQ
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="ui-btn ui-btn-primary"
                >
                  <UploadIcon size={13} />
                  {isUploading ? "Uploading…" : "Attach files"}
                </button>
              </>
            }
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={quotationFileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
            onChange={(e) => {
              void handleFiles(e.target.files, undefined, QUOTATION_RFQ_DOCUMENT_CATEGORY);
              e.target.value = "";
            }}
          />

          <SectionCard
            className="mb-5"
            title="Quotations / RFQ"
            description="Optional — attach the client RFQ, your quotation, or related reference files."
            headerRight={
              <button
                type="button"
                disabled={isUploading}
                onClick={openQuotationUpload}
                className="ui-btn ui-btn-sm ui-btn-ghost"
              >
                <UploadIcon size={12} />
                Upload
              </button>
            }
          >
            {quotationDocs.length === 0 ? (
              <p className="text-sm text-[var(--ink-500)]">
                No quotation or RFQ files yet. Use Upload to attach PDF, Word, Excel, or image files.
              </p>
            ) : (
              <div className="space-y-3">
                {quotationDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    uploading={isUploading}
                    onAttach={(docId, files) => void handleFiles(files, docId)}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mb-5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${
              dragOver
                ? "border-[var(--brand)] bg-[var(--brand-tint)]"
                : "border-[var(--line-strong)] bg-[var(--surface)]"
            }`}
          >
            <p className="text-sm font-semibold text-[var(--ink-800)]">
              Drop PDF, images, or office files here
            </p>
            <p className="mt-1 text-xs text-[var(--ink-500)]">
              Or use Attach files. Max 20 MB each · PDF, PNG, JPG, DOC, XLS, ZIP
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <label className="ui-label !mb-0 !inline-flex items-center gap-2">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="ui-input ui-input-compact !w-auto min-w-[9rem]"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="ui-btn ui-btn-sm ui-btn-ghost"
              >
                Browse files
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={openQuotationUpload}
                className="ui-btn ui-btn-sm ui-btn-ghost"
              >
                Upload Quotation / RFQ
              </button>
            </div>
          </div>

          {checklistDocs.length > 0 ? (
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-card)]">
              <span className="ui-num text-sm font-semibold text-[var(--ink-800)]">
                {attachedCount} of {checklistDocs.length} with files attached
              </span>
              {checklistDocs.some((d) => !d.storedName) ? (
                <span className="text-xs text-[var(--ink-500)]">
                  Checklist items still need a file — use Attach on each row.
                </span>
              ) : null}
            </div>
          ) : null}

          {checklistDocs.length === 0 ? (
            <section className="ui-card">
              <EmptyState
                title={isLoading ? "Loading documents…" : "No checklist documents yet"}
                description={
                  isLoading
                    ? undefined
                    : "Attach the papers and certifications required for this project, or start from the standard checklist then upload each file."
                }
                action={
                  isLoading ? null : (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="ui-btn ui-btn-primary"
                      >
                        <UploadIcon size={13} />
                        Attach files
                      </button>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={openQuotationUpload}
                        className="ui-btn ui-btn-ghost"
                      >
                        <UploadIcon size={13} />
                        Upload Quotation / RFQ
                      </button>
                      <button
                        type="button"
                        onClick={handleSeed}
                        disabled={isSeeding}
                        className="ui-btn ui-btn-ghost"
                      >
                        {isSeeding ? "Creating…" : "Use standard checklist"}
                      </button>
                    </div>
                  )
                }
              />
            </section>
          ) : (
            <div className="space-y-4">
              {grouped.map(([cat, items]) => {
                const withFiles = items.filter((d) => d.storedName).length;
                return (
                  <SectionCard
                    key={cat}
                    title={cat}
                    description={`${items.length} document${items.length === 1 ? "" : "s"}`}
                    headerRight={
                      <span
                        className={`ui-badge ${
                          withFiles === items.length ? "ui-badge-ok" : "ui-badge-neutral"
                        }`}
                      >
                        {withFiles}/{items.length} attached
                      </span>
                    }
                  >
                    <div className="space-y-3">
                      {items.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          doc={doc}
                          uploading={isUploading}
                          onAttach={(docId, files) => void handleFiles(files, docId)}
                        />
                      ))}
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
