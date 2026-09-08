import { get, put } from "@vercel/blob";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const seedDir = path.join(process.cwd(), "data");
const dataDir = isServerless ? path.join("/tmp", "techcentrix-data") : seedDir;
const dbPath = path.join(dataDir, "techcentrix.db");
const seedDbPath = path.join(seedDir, "techcentrix.db");
const BLOB_PATHNAME = "techcentrix/techcentrix.db";

declare global {
  // eslint-disable-next-line no-var
  var __techcentrixDb: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __techcentrixDbReady: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __techcentrixPersistQueue: Promise<void> | undefined;
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function copySeedIfNeeded() {
  ensureDataDir();
  if (!fs.existsSync(dbPath) && fs.existsSync(seedDbPath)) {
    fs.copyFileSync(seedDbPath, dbPath);
  }
}

function runMigrations(database: Database.Database) {
  database.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    quoteNumber TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    vatPct REAL NOT NULL,
    client TEXT NOT NULL,
    items TEXT NOT NULL,
    terms TEXT NOT NULL,
    preparedBy TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS catalog_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    specs TEXT NOT NULL,
    inclusions TEXT NOT NULL,
    warranty TEXT NOT NULL,
    unit TEXT NOT NULL,
    supplierCost REAL NOT NULL,
    markupPct REAL NOT NULL,
    unitPrice REAL NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    clientName TEXT NOT NULL,
    clientOffice TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    progressPct REAL NOT NULL,
    startDate TEXT NOT NULL,
    targetDate TEXT NOT NULL,
    quoteId TEXT,
    quoteNumber TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rfqs (
    id TEXT PRIMARY KEY,
    rfqNumber TEXT NOT NULL,
    title TEXT NOT NULL,
    clientName TEXT NOT NULL,
    clientOffice TEXT NOT NULL,
    clientAddress TEXT NOT NULL,
    dateReceived TEXT NOT NULL,
    deadline TEXT NOT NULL,
    abc REAL NOT NULL,
    modeOfProcurement TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT NOT NULL,
    quoteId TEXT,
    quoteNumber TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bids (
    id TEXT PRIMARY KEY,
    referenceNumber TEXT NOT NULL,
    title TEXT NOT NULL,
    clientOffice TEXT NOT NULL,
    abc REAL NOT NULL,
    bidAmount REAL NOT NULL,
    bidBondAmount REAL NOT NULL,
    bidBondPosted INTEGER NOT NULL,
    preBidDate TEXT NOT NULL,
    openingDate TEXT NOT NULL,
    status TEXT NOT NULL,
    awardedTo TEXT NOT NULL,
    awardAmount REAL NOT NULL,
    notes TEXT NOT NULL,
    rfqId TEXT,
    quoteId TEXT,
    quoteNumber TEXT,
    projectId TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS project_documents (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    reference TEXT NOT NULL,
    dueDate TEXT NOT NULL,
    completedDate TEXT NOT NULL,
    notes TEXT NOT NULL,
    fileName TEXT NOT NULL DEFAULT '',
    storedName TEXT NOT NULL DEFAULT '',
    mimeType TEXT NOT NULL DEFAULT '',
    fileSize INTEGER NOT NULL DEFAULT 0,
    sortOrder INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_project_documents_projectId
    ON project_documents (projectId);
`);

  const projectColumns = database
    .prepare("PRAGMA table_info(projects)")
    .all() as Array<{ name: string }>;
  const projectColumnNames = new Set(projectColumns.map((c) => c.name));
  if (!projectColumnNames.has("quoteId")) {
    database.exec("ALTER TABLE projects ADD COLUMN quoteId TEXT");
  }
  if (!projectColumnNames.has("quoteNumber")) {
    database.exec("ALTER TABLE projects ADD COLUMN quoteNumber TEXT");
  }

  const documentColumns = database
    .prepare("PRAGMA table_info(project_documents)")
    .all() as Array<{ name: string }>;
  const documentColumnNames = new Set(documentColumns.map((c) => c.name));
  if (!documentColumnNames.has("fileName")) {
    database.exec("ALTER TABLE project_documents ADD COLUMN fileName TEXT NOT NULL DEFAULT ''");
  }
  if (!documentColumnNames.has("storedName")) {
    database.exec("ALTER TABLE project_documents ADD COLUMN storedName TEXT NOT NULL DEFAULT ''");
  }
  if (!documentColumnNames.has("mimeType")) {
    database.exec("ALTER TABLE project_documents ADD COLUMN mimeType TEXT NOT NULL DEFAULT ''");
  }
  if (!documentColumnNames.has("fileSize")) {
    database.exec("ALTER TABLE project_documents ADD COLUMN fileSize INTEGER NOT NULL DEFAULT 0");
  }
}

function openDatabase(): Database.Database {
  copySeedIfNeeded();
  if (!fs.existsSync(dbPath)) {
    ensureDataDir();
    fs.writeFileSync(dbPath, "");
  }
  const database = new Database(dbPath);
  database.pragma(isServerless ? "journal_mode = DELETE" : "journal_mode = WAL");
  runMigrations(database);
  return database;
}

async function downloadBlobToFile(): Promise<boolean> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return false;

  try {
    const result = await get(BLOB_PATHNAME, {
      access: "private",
      token,
      useCache: false,
    });
    if (!result?.stream) return false;

    const chunks: Buffer[] = [];
    const reader = result.stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    const buffer = Buffer.concat(chunks);
    if (buffer.byteLength < 100) return false;

    ensureDataDir();
    fs.writeFileSync(dbPath, buffer);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/not found|404/i.test(message)) return false;
    console.error("[db] blob hydrate failed", err);
    return false;
  }
}

export async function ensureDbReady(): Promise<void> {
  if (globalThis.__techcentrixDb) return;

  if (!globalThis.__techcentrixDbReady) {
    globalThis.__techcentrixDbReady = (async () => {
      ensureDataDir();
      if (isServerless) {
        const restored = await downloadBlobToFile();
        if (!restored) copySeedIfNeeded();
      } else {
        copySeedIfNeeded();
      }
      globalThis.__techcentrixDb = openDatabase();
    })();
  }

  await globalThis.__techcentrixDbReady;
}

function requireDb(): Database.Database {
  if (!globalThis.__techcentrixDb) {
    // Local/dev fallback when instrumentation has not run yet
    ensureDataDir();
    copySeedIfNeeded();
    globalThis.__techcentrixDb = openDatabase();
  }
  return globalThis.__techcentrixDb;
}

export async function persistDb(): Promise<void> {
  if (!isServerless) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    console.error(
      "[db] BLOB_READ_WRITE_TOKEN is missing — writes will not survive refresh on Vercel"
    );
    return;
  }

  await ensureDbReady();
  const database = requireDb();
  database.pragma("wal_checkpoint(TRUNCATE)");

  const buffer = fs.readFileSync(dbPath);
  await put(BLOB_PATHNAME, buffer, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/x-sqlite3",
    token,
  });
}

/** Queue a durable upload after local SQLite mutations (serverless only). */
export function schedulePersist(): void {
  if (!isServerless) return;
  const prev = globalThis.__techcentrixPersistQueue ?? Promise.resolve();
  globalThis.__techcentrixPersistQueue = prev
    .then(() => persistDb())
    .catch((err) => {
      console.error("[db] persist failed", err);
    });
}

export async function flushPersist(): Promise<void> {
  schedulePersist();
  await (globalThis.__techcentrixPersistQueue ?? Promise.resolve());
}

const db = new Proxy({} as Database.Database, {
  get(_target, property, _receiver) {
    const instance = requireDb();
    const value = Reflect.get(instance, property, instance);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});

export default db;
