import { NextResponse } from "next/server";
import { buildProjectFromQuote } from "@/lib/projectFromQuote";
import { ensureDbReady, flushPersist } from "@/lib/server/db";
import { getQuoteById, replaceQuote } from "@/lib/server/quotesRepo";
import { getProjectByQuoteId, insertProject } from "@/lib/server/projectsRepo";
import { seedDocumentsForProject } from "@/lib/server/documentsRepo";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  const quote = getQuoteById(id);
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const existing = getProjectByQuoteId(id);
  if (existing) {
    const updatedQuote =
      quote.status === "Won"
        ? quote
        : replaceQuote({ ...quote, status: "Won", updatedAt: new Date().toISOString() }) ?? {
            ...quote,
            status: "Won" as const,
          };
    await flushPersist();
    return NextResponse.json({ project: existing, quote: updatedQuote, alreadyExists: true });
  }

  const project = buildProjectFromQuote(quote);
  insertProject(project);
  seedDocumentsForProject(project.id);

  const updatedQuote = replaceQuote({
    ...quote,
    status: "Won",
    updatedAt: new Date().toISOString(),
  });

  await flushPersist();

  return NextResponse.json(
    { project, quote: updatedQuote ?? { ...quote, status: "Won" }, alreadyExists: false },
    { status: 201 }
  );
}
