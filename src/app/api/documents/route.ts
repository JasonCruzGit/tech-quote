import { NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import {
  insertDocument,
  listDocuments,
  listDocumentsByProject,
  nextSortOrder,
} from "@/lib/server/documentsRepo";
import type { DocumentCategory, ProjectDocument } from "@/lib/types";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  const documents = projectId ? listDocumentsByProject(projectId) : listDocuments();
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<ProjectDocument>;
  if (!body.projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const doc: ProjectDocument = {
    id: generateId(),
    projectId: body.projectId,
    name: body.name ?? "",
    category: (body.category as DocumentCategory) ?? "Other",
    status: body.status ?? "Not started",
    reference: body.reference ?? "",
    dueDate: body.dueDate ?? "",
    completedDate: body.completedDate ?? "",
    notes: body.notes ?? "",
    fileName: body.fileName ?? "",
    storedName: body.storedName ?? "",
    mimeType: body.mimeType ?? "",
    fileSize: body.fileSize ?? 0,
    sortOrder: body.sortOrder ?? nextSortOrder(body.projectId),
    createdAt: now,
    updatedAt: now,
  };
  insertDocument(doc);
  return NextResponse.json({ document: doc }, { status: 201 });
}
