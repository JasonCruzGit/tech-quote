import { NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import { ensureDbReady, flushPersist } from "@/lib/server/db";
import {
  insertCompanyDocument,
  listCompanyDocuments,
} from "@/lib/server/companyDocumentsRepo";
import type { CompanyDocument, CompanyDocumentCategory } from "@/lib/types";

export async function GET() {
  await ensureDbReady();
  return NextResponse.json({ documents: listCompanyDocuments() });
}

export async function POST(request: Request) {
  await ensureDbReady();
  const body = (await request.json().catch(() => ({}))) as Partial<CompanyDocument>;
  const now = new Date().toISOString();
  const doc: CompanyDocument = {
    id: generateId(),
    name: body.name?.trim() || "Untitled document",
    category: (body.category as CompanyDocumentCategory) || "Other",
    expiresOn: body.expiresOn?.trim() || "",
    notes: body.notes?.trim() || "",
    fileName: "",
    storedName: "",
    mimeType: "",
    fileSize: 0,
    createdAt: now,
    updatedAt: now,
  };
  insertCompanyDocument(doc);
  await flushPersist();
  return NextResponse.json({ document: doc }, { status: 201 });
}
