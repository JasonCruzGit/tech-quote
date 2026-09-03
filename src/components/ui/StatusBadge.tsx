import type {
  BidStatus,
  DocumentStatus,
  ProjectStatus,
  QuoteStatus,
  RfqStatus,
} from "@/lib/types";

type Tone = "neutral" | "brand" | "ok" | "warn" | "info" | "danger";

const QUOTE_TONE: Record<QuoteStatus, Tone> = {
  Draft: "neutral",
  Sent: "info",
  Approved: "warn",
  Won: "ok",
};

const PROJECT_TONE: Record<ProjectStatus, Tone> = {
  Planning: "brand",
  Ongoing: "info",
  "On Hold": "neutral",
  Completed: "ok",
};

export default function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={`ui-badge ui-badge-${tone}`}>
      <span className="ui-badge-dot" />
      {label}
    </span>
  );
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <StatusBadge tone={QUOTE_TONE[status]} label={status} />;
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <StatusBadge tone={PROJECT_TONE[status]} label={status} />;
}

const RFQ_TONE: Record<RfqStatus, Tone> = {
  New: "brand",
  Quoted: "info",
  Submitted: "warn",
  Won: "ok",
  Lost: "danger",
  Cancelled: "neutral",
};

export function RfqStatusBadge({ status }: { status: RfqStatus }) {
  return <StatusBadge tone={RFQ_TONE[status]} label={status} />;
}

const BID_TONE: Record<BidStatus, Tone> = {
  Preparing: "brand",
  Submitted: "info",
  Opened: "warn",
  Won: "ok",
  Lost: "danger",
  Cancelled: "neutral",
};

export function BidStatusBadge({ status }: { status: BidStatus }) {
  return <StatusBadge tone={BID_TONE[status]} label={status} />;
}

const DOCUMENT_TONE: Record<DocumentStatus, Tone> = {
  "Not started": "neutral",
  "In progress": "warn",
  Submitted: "info",
  Approved: "ok",
  "Not applicable": "neutral",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <StatusBadge tone={DOCUMENT_TONE[status]} label={status} />;
}
