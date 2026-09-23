import { NextResponse } from "next/server";
import { ensureDbReady, flushPersist } from "@/lib/server/db";
import { deleteCompanyDocumentFile } from "@/lib/server/companyDocumentFiles";
import {
  getCompanyDocumentById,
  removeCompanyDocument,
  replaceCompanyDocument,
} from "@/lib/server/companyDocumentsRepo";
import type { CompanyDocument } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  const document = getCompanyDocumentById(id);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json({ document });
}

export async function PUT(request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  const body = (await request.json()) as CompanyDocument;
  if (body.id !== id) {
    return NextResponse.json({ error: "Document id mismatch" }, { status: 400 });
  }
  const existing = getCompanyDocumentById(id);
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const updated = replaceCompanyDocument({
    ...existing,
    name: body.name?.trim() || existing.name,
    category: body.category || existing.category,
    expiresOn: body.expiresOn?.trim() ?? existing.expiresOn,
    notes: body.notes?.trim() ?? existing.notes,
    updatedAt: new Date().toISOString(),
  });
  await flushPersist();
  return NextResponse.json({ document: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  const existing = getCompanyDocumentById(id);
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (existing.storedName) {
    await deleteCompanyDocumentFile(existing.storedName);
  }
  removeCompanyDocument(id);
  await flushPersist();
  return NextResponse.json({ ok: true });
}
