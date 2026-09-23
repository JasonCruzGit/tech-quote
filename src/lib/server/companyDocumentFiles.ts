import { del, get, put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";
import {
  fileExtension,
  isAllowedDocument,
  MAX_DOCUMENT_BYTES,
  sanitizeFileName,
} from "@/lib/server/documentFiles";

export { isAllowedDocument, MAX_DOCUMENT_BYTES, sanitizeFileName, fileExtension };

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_ROOT = isServerless
  ? path.join("/tmp", "techcentrix-data", "uploads", "company")
  : path.join(process.cwd(), "data", "uploads", "company");

function blobPath(storedName: string) {
  return `company-docs/${storedName}`;
}

function ensureLocalRoot() {
  if (!fs.existsSync(LOCAL_ROOT)) {
    fs.mkdirSync(LOCAL_ROOT, { recursive: true });
  }
}

function localPath(storedName: string) {
  return path.join(LOCAL_ROOT, storedName);
}

async function writeBlob(storedName: string, bytes: Buffer) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return;
  await put(blobPath(storedName), bytes, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/octet-stream",
    token,
  });
}

async function readBlob(storedName: string): Promise<Buffer | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;
  try {
    const result = await get(blobPath(storedName), {
      access: "private",
      token,
      useCache: false,
    });
    if (!result?.stream) return null;
    const chunks: Buffer[] = [];
    const reader = result.stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

async function deleteBlob(storedName: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token || !storedName) return;
  try {
    await del(blobPath(storedName), { token });
  } catch {
    // ignore missing blob
  }
}

export async function writeCompanyDocumentFile(
  documentId: string,
  originalName: string,
  bytes: Buffer
): Promise<{ storedName: string; fileName: string }> {
  ensureLocalRoot();
  const fileName = sanitizeFileName(originalName);
  const ext = fileExtension(fileName);
  const storedName = `${documentId}${ext || ".bin"}`;
  fs.writeFileSync(localPath(storedName), bytes);
  await writeBlob(storedName, bytes);
  return { storedName, fileName };
}

export async function readCompanyDocumentFile(
  storedName: string
): Promise<Buffer | null> {
  if (!storedName) return null;
  const full = localPath(storedName);
  if (fs.existsSync(full)) {
    return fs.readFileSync(full);
  }
  const fromBlob = await readBlob(storedName);
  if (fromBlob) {
    ensureLocalRoot();
    fs.writeFileSync(full, fromBlob);
  }
  return fromBlob;
}

export async function deleteCompanyDocumentFile(storedName: string) {
  if (!storedName) return;
  const full = localPath(storedName);
  if (fs.existsSync(full)) fs.unlinkSync(full);
  await deleteBlob(storedName);
}
