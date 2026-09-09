export type QuoteStatus = "Draft" | "Sent" | "Approved" | "Won";

export interface Client {
  name: string; // contact person, e.g. "Sir Bodjie Lorenzo"
  office: string; // e.g. "MDRRMO Rizal"
  address: string; // e.g. "Municipal Government of Rizal, Palawan"
}

export interface LineItem {
  id: string;
  title: string; // bold item title, e.g. "ADVANCE DRONE WITH PERIPHERALS"
  specs: string[]; // bullet lines; inline **bold** and *italic* supported
  inclusions: string[]; // bullet lines under INCLUSION:
  warranty: string; // e.g. "at least 1 Year Warranty"
  qty: number;
  unit: string; // unit of measure, e.g. "unit", "pcs", "lot"

  // Client-facing pricing (white / printable zone)
  unitPrice: number;
  priceManuallySet: boolean; // true once user overrides the suggested price

  // Internal costing (gray / editor-only zone)
  supplierCost: number; // per unit, VAT exclusive
  markupPct: number; // e.g. 0.3 for 30%
}

export interface Terms {
  delivery: string;
  payment: string;
  warranty: string;
  pricesNote: string;
}

export interface PreparedBy {
  name: string;
  title: string;
  signatureDataUrl?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  date: string; // ISO date (yyyy-mm-dd)
  status: QuoteStatus;
  client: Client;
  items: LineItem[];
  vatPct: number; // e.g. 0.12
  terms: Terms;
  preparedBy: PreparedBy;
  createdAt: string;
  updatedAt: string;
}

/** Reusable product/service template for the item catalog */
export interface CatalogItem {
  id: string;
  title: string;
  specs: string[];
  inclusions: string[];
  warranty: string;
  unit: string;
  supplierCost: number;
  markupPct: number;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

/** Procurement mode used by Philippine government agencies */
export const PROCUREMENT_MODES = [
  "Small Value Procurement",
  "Shopping",
  "Public Bidding",
  "Negotiated Procurement",
  "Direct Contracting",
  "Other",
] as const;

export type ProcurementMode = (typeof PROCUREMENT_MODES)[number];

export type RfqStatus =
  | "New"
  | "Quoted"
  | "Submitted"
  | "Won"
  | "Lost"
  | "Cancelled";

/**
 * A Request for Quotation received from a client office. Logged on receipt,
 * then converted into a quotation which may in turn lead to a bid or project.
 */
export interface Rfq {
  id: string;
  /** The agency's own reference number for the solicitation */
  rfqNumber: string;
  title: string;
  clientName: string;
  clientOffice: string;
  clientAddress: string;
  dateReceived: string; // yyyy-mm-dd
  /** Submission deadline */
  deadline: string; // yyyy-mm-dd
  /** Approved Budget for the Contract */
  abc: number;
  modeOfProcurement: ProcurementMode;
  status: RfqStatus;
  notes: string;
  /** Quotation prepared in response to this RFQ */
  quoteId: string | null;
  quoteNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BidStatus =
  | "Preparing"
  | "Submitted"
  | "Opened"
  | "Won"
  | "Lost"
  | "Cancelled";

/** A formal public-bidding opportunity and our submission against it */
export interface Bid {
  id: string;
  /** Invitation to Bid reference number */
  referenceNumber: string;
  title: string;
  clientOffice: string;
  /** Approved Budget for the Contract */
  abc: number;
  /** Our submitted bid amount */
  bidAmount: number;
  bidBondAmount: number;
  bidBondPosted: boolean;
  preBidDate: string; // yyyy-mm-dd
  openingDate: string; // yyyy-mm-dd
  status: BidStatus;
  /** Winning bidder when we did not win */
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

export type DocumentStatus =
  | "Not started"
  | "In progress"
  | "Submitted"
  | "Approved"
  | "Not applicable";

export const DOCUMENT_CATEGORIES = [
  "Eligibility",
  "Award",
  "Delivery",
  "Payment",
  "Turnover",
  "Other",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/** A single required document tracked against a project */
export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  category: DocumentCategory;
  status: DocumentStatus;
  /** Document / transmittal number */
  reference: string;
  dueDate: string; // yyyy-mm-dd
  completedDate: string; // yyyy-mm-dd
  notes: string;
  /** Original filename when a file is attached */
  fileName: string;
  /** Stored filename on disk (empty when no file) */
  storedName: string;
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Ordering within the project checklist */
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = "Planning" | "Ongoing" | "On Hold" | "Completed";

/** Delivery / engagement project with progress tracking */
export interface Project {
  id: string;
  name: string;
  clientName: string;
  clientOffice: string;
  description: string;
  status: ProjectStatus;
  /** Overall completion, 0–100 */
  progressPct: number;
  startDate: string; // yyyy-mm-dd
  targetDate: string; // yyyy-mm-dd
  /** Source quotation when created via Mark as Won */
  quoteId: string | null;
  quoteNumber: string | null;
  createdAt: string;
  updatedAt: string;
}
