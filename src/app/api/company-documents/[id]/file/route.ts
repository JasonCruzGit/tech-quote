import { NextResponse } from "next/server";
import { ensureDbReady, flushPersist } from "@/lib/server/db";
import { readCompanyDocumentFile } from "@/lib/server/companyDocumentFiles";
import { getCompanyDocumentById } from "@/lib/server/companyDocumentsRepo";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  await ensureDbReady();
  const { id } = await params;
  const document = getCompanyDocumentById(id);
  if (!document || !document.storedName) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const bytes = await readCompanyDocumentFile(document.storedName);
  if (!bytes) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const fileName = document.fileName || document.storedName;
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": document.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
