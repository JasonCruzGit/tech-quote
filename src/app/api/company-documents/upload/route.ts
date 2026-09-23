import { NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import { ensureDbReady, flushPersist } from "@/lib/server/db";
import {
  deleteCompanyDocumentFile,
  isAllowedDocument,
  MAX_DOCUMENT_BYTES,
  writeCompanyDocumentFile,
} from "@/lib/server/companyDocumentFiles";
import {
  getCompanyDocumentById,
  insertCompanyDocument,
  replaceCompanyDocument,
} from "@/lib/server/companyDocumentsRepo";
import type { CompanyDocument, CompanyDocumentCategory } from "@/lib/types";

/**
 * Upload company documents.
 * Form fields: category, expiresOn, notes, documentId (optional replace)
 * Files: files / file
 */
export async function POST(request: Request) {
  await ensureDbReady();
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const category = (String(form.get("category") ?? "Other") ||
    "Other") as CompanyDocumentCategory;
  const expiresOn = String(form.get("expiresOn") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const existingId = String(form.get("documentId") ?? "").trim();
  const nameOverride = String(form.get("name") ?? "").trim();

  const rawFiles = [...form.getAll("files"), ...form.getAll("file")].filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );

  if (rawFiles.length === 0) {
    return NextResponse.json({ error: "No files selected" }, { status: 400 });
  }

  const uploaded: CompanyDocument[] = [];
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

    if (existingId && uploaded.length === 0) {
      const existing = getCompanyDocumentById(existingId);
      if (!existing) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
      if (existing.storedName) {
        await deleteCompanyDocumentFile(existing.storedName);
      }
      const { storedName, fileName } = await writeCompanyDocumentFile(
        existing.id,
        file.name,
        bytes
      );
      const doc = replaceCompanyDocument({
        ...existing,
        name: nameOverride || existing.name.trim() || fileName.replace(/\.[^.]+$/, ""),
        category,
        expiresOn: expiresOn || existing.expiresOn,
        notes: notes || existing.notes,
        fileName,
        storedName,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        updatedAt: now,
      });
      if (doc) uploaded.push(doc);
      continue;
    }

    const id = generateId();
    const { storedName, fileName } = await writeCompanyDocumentFile(id, file.name, bytes);
    const doc: CompanyDocument = {
      id,
      name: nameOverride || fileName.replace(/\.[^.]+$/, "") || fileName,
      category,
      expiresOn,
      notes,
      fileName,
      storedName,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      createdAt: now,
      updatedAt: now,
    };
    insertCompanyDocument(doc);
    uploaded.push(doc);
  }

  await flushPersist();

  if (uploaded.length === 0) {
    return NextResponse.json(
      { error: errors[0] ?? "Upload failed", errors },
      { status: 400 }
    );
  }

  return NextResponse.json({ documents: uploaded, errors }, { status: 201 });
}
