import { NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import {
  deleteDocumentFile,
  isAllowedDocument,
  MAX_DOCUMENT_BYTES,
  writeDocumentFile,
} from "@/lib/server/documentFiles";
import {
  getDocumentById,
  insertDocument,
  nextSortOrder,
  replaceDocument,
} from "@/lib/server/documentsRepo";
import { getProjectById } from "@/lib/server/projectsRepo";
import type { DocumentCategory, ProjectDocument } from "@/lib/types";

/**
 * Upload one or more files for a project.
 * Form fields: projectId (required), category (optional), documentId (optional — attach to existing row)
 * Files: "files" or "file"
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const projectId = String(form.get("projectId") ?? "").trim();
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!getProjectById(projectId)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const category = (String(form.get("category") ?? "Other") ||
    "Other") as DocumentCategory;
  const existingId = String(form.get("documentId") ?? "").trim();

  const rawFiles = [
    ...form.getAll("files"),
    ...form.getAll("file"),
  ].filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (rawFiles.length === 0) {
    return NextResponse.json({ error: "No files selected" }, { status: 400 });
  }

  const uploaded: ProjectDocument[] = [];
  const errors: string[] = [];
  const now = new Date().toISOString();

  for (const file of rawFiles) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      errors.push(`${file.name}: exceeds 20 MB limit`);
      continue;
    }
    if (!isAllowedDocument(file.name)) {
      errors.push(`${file.name}: file type not allowed`);
      continue;
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let doc: ProjectDocument | undefined;

    if (existingId && uploaded.length === 0) {
      const existing = getDocumentById(existingId);
      if (!existing || existing.projectId !== projectId) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
      if (existing.storedName) {
        deleteDocumentFile(existing.projectId, existing.storedName);
      }
      const { storedName, fileName } = writeDocumentFile(
        projectId,
        existing.id,
        file.name,
        bytes
      );
      doc = replaceDocument({
        ...existing,
        name: existing.name.trim() || fileName,
        fileName,
        storedName,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        status: existing.status === "Not started" ? "Submitted" : existing.status,
        completedDate: existing.completedDate || now.slice(0, 10),
        updatedAt: now,
      });
    } else {
      const id = generateId();
      const { storedName, fileName } = writeDocumentFile(projectId, id, file.name, bytes);
      doc = {
        id,
        projectId,
        name: fileName.replace(/\.[^.]+$/, "") || fileName,
        category,
        status: "Submitted",
        reference: "",
        dueDate: "",
        completedDate: now.slice(0, 10),
        notes: "",
        fileName,
        storedName,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        sortOrder: nextSortOrder(projectId) + uploaded.length,
        createdAt: now,
        updatedAt: now,
      };
      insertDocument(doc);
    }

    if (doc) uploaded.push(doc);
  }

  if (uploaded.length === 0) {
    return NextResponse.json(
      { error: errors[0] ?? "Upload failed", errors },
      { status: 400 }
    );
  }

  return NextResponse.json({ documents: uploaded, errors }, { status: 201 });
}
