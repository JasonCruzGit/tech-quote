import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "techcentrix.db");

declare global {
  var __techcentrixDb: Database.Database | undefined;
}

const db = globalThis.__techcentrixDb ?? new Database(dbPath);
if (process.env.NODE_ENV !== "production") {
  globalThis.__techcentrixDb = db;
}

db.pragma("journal_mode = WAL");

db.exec(`
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

const projectColumns = db.prepare("PRAGMA table_info(projects)").all() as Array<{ name: string }>;
const projectColumnNames = new Set(projectColumns.map((c) => c.name));
if (!projectColumnNames.has("quoteId")) {
  db.exec("ALTER TABLE projects ADD COLUMN quoteId TEXT");
}
if (!projectColumnNames.has("quoteNumber")) {
  db.exec("ALTER TABLE projects ADD COLUMN quoteNumber TEXT");
}

const documentColumns = db
  .prepare("PRAGMA table_info(project_documents)")
  .all() as Array<{ name: string }>;
const documentColumnNames = new Set(documentColumns.map((c) => c.name));
if (!documentColumnNames.has("fileName")) {
  db.exec("ALTER TABLE project_documents ADD COLUMN fileName TEXT NOT NULL DEFAULT ''");
}
if (!documentColumnNames.has("storedName")) {
  db.exec("ALTER TABLE project_documents ADD COLUMN storedName TEXT NOT NULL DEFAULT ''");
}
if (!documentColumnNames.has("mimeType")) {
  db.exec("ALTER TABLE project_documents ADD COLUMN mimeType TEXT NOT NULL DEFAULT ''");
}
if (!documentColumnNames.has("fileSize")) {
  db.exec("ALTER TABLE project_documents ADD COLUMN fileSize INTEGER NOT NULL DEFAULT 0");
}

export default db;
