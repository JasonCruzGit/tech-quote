import type { Bid } from "@/lib/types";
import db, { schedulePersist } from "./db";

interface BidRow {
  id: string;
  referenceNumber: string;
  title: string;
  clientOffice: string;
  abc: number;
  bidAmount: number;
  bidBondAmount: number;
  /** SQLite has no boolean type; stored as 0 / 1 */
  bidBondPosted: number;
  preBidDate: string;
  openingDate: string;
  status: string;
  awardedTo: string;
  awardAmount: number;
  notes: string;
  rfqId: string | null;
  quoteId: string | null;
  quoteNumber: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToBid(row: BidRow): Bid {
  return {
    ...row,
    bidBondPosted: row.bidBondPosted === 1,
    status: row.status as Bid["status"],
    rfqId: row.rfqId ?? null,
    quoteId: row.quoteId ?? null,
    quoteNumber: row.quoteNumber ?? null,
    projectId: row.projectId ?? null,
  };
}

function bidToRow(bid: Bid): BidRow {
  return { ...bid, bidBondPosted: bid.bidBondPosted ? 1 : 0 };
}

export function listBids(): Bid[] {
  const rows = db.prepare("SELECT * FROM bids ORDER BY updatedAt DESC").all() as BidRow[];
  return rows.map(rowToBid);
}

export function getBidById(id: string): Bid | undefined {
  const row = db.prepare("SELECT * FROM bids WHERE id = ?").get(id) as BidRow | undefined;
  return row ? rowToBid(row) : undefined;
}

export function insertBid(bid: Bid): Bid {
  db.prepare(
    `INSERT INTO bids
     (id, referenceNumber, title, clientOffice, abc, bidAmount, bidBondAmount,
      bidBondPosted, preBidDate, openingDate, status, awardedTo, awardAmount,
      notes, rfqId, quoteId, quoteNumber, projectId, createdAt, updatedAt)
     VALUES (@id, @referenceNumber, @title, @clientOffice, @abc, @bidAmount,
      @bidBondAmount, @bidBondPosted, @preBidDate, @openingDate, @status,
      @awardedTo, @awardAmount, @notes, @rfqId, @quoteId, @quoteNumber,
      @projectId, @createdAt, @updatedAt)`
  ).run(bidToRow(bid));
  schedulePersist();
  return bid;
}

export function replaceBid(bid: Bid): Bid | undefined {
  if (!getBidById(bid.id)) return undefined;
  db.prepare(
    `UPDATE bids SET
       referenceNumber=@referenceNumber, title=@title, clientOffice=@clientOffice,
       abc=@abc, bidAmount=@bidAmount, bidBondAmount=@bidBondAmount,
       bidBondPosted=@bidBondPosted, preBidDate=@preBidDate,
       openingDate=@openingDate, status=@status, awardedTo=@awardedTo,
       awardAmount=@awardAmount, notes=@notes, rfqId=@rfqId, quoteId=@quoteId,
       quoteNumber=@quoteNumber, projectId=@projectId, updatedAt=@updatedAt
     WHERE id=@id`
  ).run(bidToRow(bid));
  schedulePersist();
  return bid;
}

export function removeBid(id: string): boolean {
  const changed = db.prepare("DELETE FROM bids WHERE id = ?").run(id).changes > 0;
  if (changed) schedulePersist();
  return changed;
}
