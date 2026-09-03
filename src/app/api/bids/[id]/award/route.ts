import { NextResponse } from "next/server";
import { todayIso } from "@/lib/format";
import { generateId } from "@/lib/id";
import { getBidById, replaceBid } from "@/lib/server/bidsRepo";
import { getProjectById, insertProject } from "@/lib/server/projectsRepo";
import { seedDocumentsForProject } from "@/lib/server/documentsRepo";
import type { Project } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Marks a bid as won and opens the delivery project for it, seeding the
 * default document checklist so paperwork tracking starts immediately.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const bid = getBidById(id);
  if (!bid) {
    return NextResponse.json({ error: "Bid not found" }, { status: 404 });
  }

  if (bid.projectId) {
    const existing = getProjectById(bid.projectId);
    if (existing) {
      return NextResponse.json({ project: existing, bid, alreadyExists: true });
    }
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: generateId(),
    name: bid.title.trim() || bid.referenceNumber.trim() || "Awarded project",
    clientName: "",
    clientOffice: bid.clientOffice,
    description: bid.referenceNumber.trim()
      ? `Awarded from bid ${bid.referenceNumber.trim()}`
      : "",
    status: "Planning",
    progressPct: 0,
    startDate: todayIso(),
    targetDate: "",
    quoteId: bid.quoteId,
    quoteNumber: bid.quoteNumber,
    createdAt: now,
    updatedAt: now,
  };
  insertProject(project);
  seedDocumentsForProject(project.id);

  const updatedBid =
    replaceBid({
      ...bid,
      status: "Won",
      awardAmount: bid.awardAmount || bid.bidAmount,
      projectId: project.id,
      updatedAt: now,
    }) ?? bid;

  return NextResponse.json(
    { project, bid: updatedBid, alreadyExists: false },
    { status: 201 }
  );
}
