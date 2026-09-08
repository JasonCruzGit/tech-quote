import { DEFAULT_DOCUMENT_TEMPLATE } from "@/lib/documentTemplate";
import { generateId } from "@/lib/id";
import type { ProjectDocument } from "@/lib/types";
import db, { schedulePersist } from "./db";
import { deleteDocumentFile } from "./documentFiles";

interface DocumentRow {
  id: string;
  projectId: string;
  name: string;
  category: string;
  status: string;
  reference: string;
  dueDate: string;
  completedDate: string;
  notes: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function rowToDocument(row: DocumentRow): ProjectDocument {
  return {
    ...row,
    fileName: row.fileName ?? "",
    storedName: row.storedName ?? "",
    mimeType: row.mimeType ?? "",
    fileSize: row.fileSize ?? 0,
    category: row.category as ProjectDocument["category"],
    status: row.status as ProjectDocument["status"],
  };
}

export function listDocuments(): ProjectDocument[] {
  const rows = db
    .prepare("SELECT * FROM project_documents ORDER BY projectId, sortOrder")
    .all() as DocumentRow[];
  return rows.map(rowToDocument);
}

export function listDocumentsByProject(projectId: string): ProjectDocument[] {
  const rows = db
    .prepare("SELECT * FROM project_documents WHERE projectId = ? ORDER BY sortOrder")
    .all(projectId) as DocumentRow[];
  return rows.map(rowToDocument);
}

export function getDocumentById(id: string): ProjectDocument | undefined {
  const row = db.prepare("SELECT * FROM project_documents WHERE id = ?").get(id) as
    | DocumentRow
    | undefined;
  return row ? rowToDocument(row) : undefined;
}

export function insertDocument(doc: ProjectDocument): ProjectDocument {
  db.prepare(
    `INSERT INTO project_documents
     (id, projectId, name, category, status, reference, dueDate, completedDate,
      notes, fileName, storedName, mimeType, fileSize, sortOrder, createdAt, updatedAt)
     VALUES (@id, @projectId, @name, @category, @status, @reference, @dueDate,
      @completedDate, @notes, @fileName, @storedName, @mimeType, @fileSize,
      @sortOrder, @createdAt, @updatedAt)`
  ).run(doc);
  schedulePersist();
  return doc;
}

export function replaceDocument(doc: ProjectDocument): ProjectDocument | undefined {
  if (!getDocumentById(doc.id)) return undefined;
  db.prepare(
    `UPDATE project_documents SET
       projectId=@projectId, name=@name, category=@category, status=@status,
       reference=@reference, dueDate=@dueDate, completedDate=@completedDate,
       notes=@notes, fileName=@fileName, storedName=@storedName,
       mimeType=@mimeType, fileSize=@fileSize, sortOrder=@sortOrder, updatedAt=@updatedAt
     WHERE id=@id`
  ).run(doc);
  schedulePersist();
  return doc;
}

export function removeDocument(id: string): boolean {
  const existing = getDocumentById(id);
  if (!existing) return false;
  deleteDocumentFile(existing.projectId, existing.storedName);
  const changed = db.prepare("DELETE FROM project_documents WHERE id = ?").run(id).changes > 0;
  if (changed) schedulePersist();
  return changed;
}

export function countDocumentsForProject(projectId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM project_documents WHERE projectId = ?")
    .get(projectId) as { c: number };
  return row.c;
}

/**
 * Creates the default checklist for a project. Existing entries are left
 * untouched so this is safe to call more than once.
 */
export function seedDocumentsForProject(projectId: string): ProjectDocument[] {
  if (countDocumentsForProject(projectId) > 0) {
    return listDocumentsByProject(projectId);
  }

  const now = new Date().toISOString();
  const docs: ProjectDocument[] = DEFAULT_DOCUMENT_TEMPLATE.map((entry, index) => ({
    id: generateId(),
    projectId,
    name: entry.name,
    category: entry.category,
    status: "Not started",
    reference: "",
    dueDate: "",
    completedDate: "",
    notes: "",
    fileName: "",
    storedName: "",
    mimeType: "",
    fileSize: 0,
    sortOrder: index,
    createdAt: now,
    updatedAt: now,
  }));

  const insertMany = db.transaction((rows: ProjectDocument[]) => {
    for (const row of rows) insertDocument(row);
  });
  insertMany(docs);

  return docs;
}

export function nextSortOrder(projectId: string): number {
  const row = db
    .prepare("SELECT MAX(sortOrder) as m FROM project_documents WHERE projectId = ?")
    .get(projectId) as { m: number | null };
  return (row.m ?? -1) + 1;
}
