import { NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import { insertProject, listProjects } from "@/lib/server/projectsRepo";
import type { Project } from "@/lib/types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  return NextResponse.json({ projects: listProjects() });
}

export async function POST() {
  const now = new Date().toISOString();
  const project: Project = {
    id: generateId(),
    name: "",
    clientName: "",
    clientOffice: "",
    description: "",
    status: "Ongoing",
    progressPct: 0,
    startDate: todayIsoDate(),
    targetDate: "",
    quoteId: null,
    quoteNumber: null,
    createdAt: now,
    updatedAt: now,
  };
  insertProject(project);
  return NextResponse.json({ project }, { status: 201 });
}
