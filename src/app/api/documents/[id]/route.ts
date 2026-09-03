import { NextResponse } from "next/server";
import {
  getDocumentById,
  removeDocument,
  replaceDocument,
} from "@/lib/server/documentsRepo";
import type { ProjectDocument } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as ProjectDocument;
  if (body.id !== id) {
    return NextResponse.json({ error: "Document id mismatch" }, { status: 400 });
  }
  const updated = replaceDocument({ ...body, updatedAt: new Date().toISOString() });
  if (!updated) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json({ document: updated });
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const document = getDocumentById(id);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json({ document });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!removeDocument(id)) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
