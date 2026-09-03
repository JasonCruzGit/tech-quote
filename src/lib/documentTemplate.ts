import type { DocumentCategory } from "./types";

export interface DocumentTemplateEntry {
  name: string;
  category: DocumentCategory;
}

/**
 * Default checklist applied to a project. Mirrors the paperwork a supplier
 * typically files for a Philippine government contract, from eligibility
 * through delivery, payment, and turnover.
 */
export const DEFAULT_DOCUMENT_TEMPLATE: DocumentTemplateEntry[] = [
  { name: "Mayor's / Business Permit", category: "Eligibility" },
  { name: "PhilGEPS Registration Certificate", category: "Eligibility" },
  { name: "Omnibus Sworn Statement", category: "Eligibility" },
  { name: "Latest Income / Business Tax Return", category: "Eligibility" },

  { name: "Notice of Award", category: "Award" },
  { name: "Purchase Order / Contract", category: "Award" },
  { name: "Notice to Proceed", category: "Award" },
  { name: "Performance Bond", category: "Award" },

  { name: "Delivery Receipt", category: "Delivery" },
  { name: "Inspection & Acceptance Report", category: "Delivery" },
  { name: "Sales Invoice", category: "Delivery" },

  { name: "Statement of Account", category: "Payment" },
  { name: "Disbursement Voucher", category: "Payment" },
  { name: "Official Receipt", category: "Payment" },

  { name: "Certificate of Completion", category: "Turnover" },
  { name: "Warranty Certificate", category: "Turnover" },
  { name: "Training / Turnover Certificate", category: "Turnover" },
];
