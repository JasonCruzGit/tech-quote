import fs from "node:fs";
import path from "node:path";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads", "documents");

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".zip",
]);

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export function ensureUploadRoot() {
  if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  }
}

export function projectUploadDir(projectId: string): string {
  const dir = path.join(UPLOAD_ROOT, projectId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ()[\]]+/g, "_").trim();
  return base.slice(0, 180) || "document";
}

export function fileExtension(name: string): string {
  return path.extname(name).toLowerCase();
}

export function isAllowedDocument(name: string): boolean {
  return ALLOWED_EXTENSIONS.has(fileExtension(name));
}

export function storedFilePath(projectId: string, storedName: string): string {
  return path.join(projectUploadDir(projectId), storedName);
}

export function writeDocumentFile(
  projectId: string,
  documentId: string,
  originalName: string,
  bytes: Buffer
): { storedName: string; fileName: string } {
  ensureUploadRoot();
  const fileName = sanitizeFileName(originalName);
  const ext = fileExtension(fileName);
  const storedName = `${documentId}${ext || ".bin"}`;
  fs.writeFileSync(storedFilePath(projectId, storedName), bytes);
  return { storedName, fileName };
}

export function readDocumentFile(
  projectId: string,
  storedName: string
): Buffer | null {
  if (!storedName) return null;
  const full = storedFilePath(projectId, storedName);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full);
}

export function deleteDocumentFile(projectId: string, storedName: string) {
  if (!storedName) return;
  const full = storedFilePath(projectId, storedName);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
  }
}
