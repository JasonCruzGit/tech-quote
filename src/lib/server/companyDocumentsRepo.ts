import type { CompanyDocument } from "@/lib/types";
import db, { schedulePersist } from "./db";

interface CompanyDocumentRow {
  id: string;
  name: string;
  category: string;
  expiresOn: string;
  notes: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

function rowToDoc(row: CompanyDocumentRow): CompanyDocument {
  return {
    ...row,
    category: row.category as CompanyDocument["category"],
    expiresOn: row.expiresOn ?? "",
    notes: row.notes ?? "",
    fileName: row.fileName ?? "",
    storedName: row.storedName ?? "",
    mimeType: row.mimeType ?? "",
    fileSize: row.fileSize ?? 0,
  };
}

export function listCompanyDocuments(): CompanyDocument[] {
  const rows = db
    .prepare("SELECT * FROM company_documents ORDER BY updatedAt DESC")
    .all() as CompanyDocumentRow[];
  return rows.map(rowToDoc);
}

export function getCompanyDocumentById(id: string): CompanyDocument | undefined {
  const row = db.prepare("SELECT * FROM company_documents WHERE id = ?").get(id) as
    | CompanyDocumentRow
    | undefined;
  return row ? rowToDoc(row) : undefined;
}

export function insertCompanyDocument(doc: CompanyDocument): CompanyDocument {
  db.prepare(
    `INSERT INTO company_documents
     (id, name, category, expiresOn, notes, fileName, storedName, mimeType, fileSize, createdAt, updatedAt)
     VALUES (@id, @name, @category, @expiresOn, @notes, @fileName, @storedName, @mimeType, @fileSize, @createdAt, @updatedAt)`
  ).run(doc);
  schedulePersist();
  return doc;
}

export function replaceCompanyDocument(doc: CompanyDocument): CompanyDocument | undefined {
  if (!getCompanyDocumentById(doc.id)) return undefined;
  db.prepare(
    `UPDATE company_documents SET
       name=@name, category=@category, expiresOn=@expiresOn, notes=@notes,
       fileName=@fileName, storedName=@storedName, mimeType=@mimeType,
       fileSize=@fileSize, updatedAt=@updatedAt
     WHERE id=@id`
  ).run(doc);
  schedulePersist();
  return doc;
}

export function removeCompanyDocument(id: string): boolean {
  const result = db.prepare("DELETE FROM company_documents WHERE id = ?").run(id);
  if (result.changes > 0) schedulePersist();
  return result.changes > 0;
}
