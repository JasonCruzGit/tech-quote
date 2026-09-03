import type { Project } from "@/lib/types";
import db from "./db";

interface ProjectRow {
  id: string;
  name: string;
  clientName: string;
  clientOffice: string;
  description: string;
  status: string;
  progressPct: number;
  startDate: string;
  targetDate: string;
  quoteId: string | null;
  quoteNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    clientName: row.clientName,
    clientOffice: row.clientOffice,
    description: row.description,
    status: row.status as Project["status"],
    progressPct: row.progressPct,
    startDate: row.startDate,
    targetDate: row.targetDate,
    quoteId: row.quoteId ?? null,
    quoteNumber: row.quoteNumber ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listProjects(): Project[] {
  const rows = db
    .prepare("SELECT * FROM projects ORDER BY updatedAt DESC")
    .all() as ProjectRow[];
  return rows.map(rowToProject);
}

export function getProjectById(id: string): Project | undefined {
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | ProjectRow
    | undefined;
  return row ? rowToProject(row) : undefined;
}

export function getProjectByQuoteId(quoteId: string): Project | undefined {
  const row = db
    .prepare("SELECT * FROM projects WHERE quoteId = ? ORDER BY createdAt DESC LIMIT 1")
    .get(quoteId) as ProjectRow | undefined;
  return row ? rowToProject(row) : undefined;
}

export function insertProject(project: Project): Project {
  db.prepare(
    `INSERT INTO projects
     (id, name, clientName, clientOffice, description, status, progressPct, startDate, targetDate, quoteId, quoteNumber, createdAt, updatedAt)
     VALUES (@id, @name, @clientName, @clientOffice, @description, @status, @progressPct, @startDate, @targetDate, @quoteId, @quoteNumber, @createdAt, @updatedAt)`
  ).run(project);
  return project;
}

export function replaceProject(project: Project): Project | undefined {
  if (!getProjectById(project.id)) return undefined;
  db.prepare(
    `UPDATE projects SET
       name=@name, clientName=@clientName, clientOffice=@clientOffice,
       description=@description, status=@status, progressPct=@progressPct,
       startDate=@startDate, targetDate=@targetDate,
       quoteId=@quoteId, quoteNumber=@quoteNumber, updatedAt=@updatedAt
     WHERE id=@id`
  ).run(project);
  return project;
}

export function removeProject(id: string): boolean {
  const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}
