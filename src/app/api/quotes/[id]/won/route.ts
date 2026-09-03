import { NextResponse } from "next/server";
import { buildProjectFromQuote } from "@/lib/projectFromQuote";
import { getQuoteById, replaceQuote } from "@/lib/server/quotesRepo";
import { getProjectByQuoteId, insertProject } from "@/lib/server/projectsRepo";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
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
    return NextResponse.json({ project: existing, quote: updatedQuote, alreadyExists: true });
  }

  const project = buildProjectFromQuote(quote);
  insertProject(project);

  const updatedQuote = replaceQuote({
    ...quote,
    status: "Won",
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json(
    { project, quote: updatedQuote ?? { ...quote, status: "Won" }, alreadyExists: false },
    { status: 201 }
  );
}
