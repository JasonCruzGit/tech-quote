import type { Rfq } from "@/lib/types";
import db, { schedulePersist } from "./db";

interface RfqRow {
  id: string;
  rfqNumber: string;
  title: string;
  clientName: string;
  clientOffice: string;
  clientAddress: string;
  dateReceived: string;
  deadline: string;
  abc: number;
  modeOfProcurement: string;
  status: string;
  notes: string;
  quoteId: string | null;
  quoteNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToRfq(row: RfqRow): Rfq {
  return {
    ...row,
    modeOfProcurement: row.modeOfProcurement as Rfq["modeOfProcurement"],
    status: row.status as Rfq["status"],
    quoteId: row.quoteId ?? null,
    quoteNumber: row.quoteNumber ?? null,
  };
}

export function listRfqs(): Rfq[] {
  const rows = db.prepare("SELECT * FROM rfqs ORDER BY updatedAt DESC").all() as RfqRow[];
  return rows.map(rowToRfq);
}

export function getRfqById(id: string): Rfq | undefined {
  const row = db.prepare("SELECT * FROM rfqs WHERE id = ?").get(id) as RfqRow | undefined;
  return row ? rowToRfq(row) : undefined;
}

export function insertRfq(rfq: Rfq): Rfq {
  db.prepare(
    `INSERT INTO rfqs
     (id, rfqNumber, title, clientName, clientOffice, clientAddress, dateReceived,
      deadline, abc, modeOfProcurement, status, notes, quoteId, quoteNumber,
      createdAt, updatedAt)
     VALUES (@id, @rfqNumber, @title, @clientName, @clientOffice, @clientAddress,
      @dateReceived, @deadline, @abc, @modeOfProcurement, @status, @notes,
      @quoteId, @quoteNumber, @createdAt, @updatedAt)`
  ).run(rfq);
  schedulePersist();
  return rfq;
}

export function replaceRfq(rfq: Rfq): Rfq | undefined {
  if (!getRfqById(rfq.id)) return undefined;
  db.prepare(
    `UPDATE rfqs SET
       rfqNumber=@rfqNumber, title=@title, clientName=@clientName,
       clientOffice=@clientOffice, clientAddress=@clientAddress,
       dateReceived=@dateReceived, deadline=@deadline, abc=@abc,
       modeOfProcurement=@modeOfProcurement, status=@status, notes=@notes,
       quoteId=@quoteId, quoteNumber=@quoteNumber, updatedAt=@updatedAt
     WHERE id=@id`
  ).run(rfq);
  schedulePersist();
  return rfq;
}

export function removeRfq(id: string): boolean {
  const changed = db.prepare("DELETE FROM rfqs WHERE id = ?").run(id).changes > 0;
  if (changed) schedulePersist();
  return changed;
}
