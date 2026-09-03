import { NextResponse } from "next/server";
import { seedDocumentsForProject } from "@/lib/server/documentsRepo";
import { getProjectById } from "@/lib/server/projectsRepo";

/** Applies the default document checklist to a project that has none yet. */
export async function POST(request: Request) {
  const { projectId } = (await request.json().catch(() => ({}))) as {
    projectId?: string;
  };
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  if (!getProjectById(projectId)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const documents = seedDocumentsForProject(projectId);
  return NextResponse.json({ documents }, { status: 201 });
}
