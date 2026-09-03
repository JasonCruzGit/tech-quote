import { NextResponse } from "next/server";
import {
  getProjectById,
  removeProject,
  replaceProject,
} from "@/lib/server/projectsRepo";
import type { Project } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as Project;
  if (body.id !== id) {
    return NextResponse.json({ error: "Project id mismatch" }, { status: 400 });
  }
  const updated = replaceProject({
    ...body,
    progressPct: clampProgress(body.progressPct),
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ project: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  if (!removeProject(id)) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
