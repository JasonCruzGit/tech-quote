"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import RecordNotFound from "@/components/ui/RecordNotFound";
import SaveIndicator from "@/components/ui/SaveIndicator";
import SectionCard from "@/components/ui/SectionCard";
import { ProjectStatusBadge } from "@/components/ui/StatusBadge";
import {
  deleteProject,
  updateProject,
  useProject,
  useProjectsLoadState,
  useProjectsSavingStatus,
} from "@/lib/projectsStore";
import { clampProgressPct, progressColor, progressFillStyle } from "@/lib/progress";
import type { ProjectStatus } from "@/lib/types";

const STATUSES: ProjectStatus[] = ["Planning", "Ongoing", "On Hold", "Completed"];

export default function ProjectEditorPage() {
  const params = useParams<{ id: string }>();
  const project = useProject(params.id);
  const loadState = useProjectsLoadState();
  const isSaving = useProjectsSavingStatus();
  const router = useRouter();

  if (!project) {
    return (
      <RecordNotFound
        isLoading={loadState === "loading" || loadState === "idle"}
        loadingLabel="Loading project…"
        missingLabel="Project not found. It may have been deleted."
        backHref="/projects/status"
        backLabel="Back to Monitoring/Status"
      />
    );
  }

  const current = project;

  function patch(partial: Partial<typeof current>) {
    updateProject(current.id, (c) => ({ ...c, ...partial }));
  }

  function handleStatusChange(status: ProjectStatus) {
    if (status === "Completed") {
      patch({ status, progressPct: 100 });
      return;
    }
    patch({ status });
  }

  function handleProgressChange(raw: number) {
    const progressPct = clampProgressPct(raw);
    const next: Partial<typeof current> = { progressPct };
    if (progressPct === 100 && current.status !== "Completed") {
      next.status = "Completed";
    } else if (progressPct < 100 && current.status === "Completed") {
      next.status = "Ongoing";
    }
    patch(next);
  }

  function handleDelete() {
    const label = current.name.trim() || "Untitled project";
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      deleteProject(current.id);
      router.push("/projects/status");
    }
  }

  const pct = clampProgressPct(current.progressPct);
  const color = progressColor(pct);

  return (
    <AppShell>
      <main className="ui-page">
        <div className="ui-page-inner-narrow">
          <PageHeader
            eyebrow={current.quoteNumber ? `From quotation ${current.quoteNumber}` : "Project"}
            title={current.name.trim() || "New Project"}
            actions={
              <>
                <SaveIndicator isSaving={isSaving} />
                <Link href="/projects/status" className="ui-btn ui-btn-ghost">
                  Back
                </Link>
                <Link
                  href={`/projects/documentation/${current.id}`}
                  className="ui-btn ui-btn-ghost"
                >
                  Documents
                </Link>
                <button type="button" onClick={handleDelete} className="ui-btn ui-btn-danger">
                  Delete
                </button>
              </>
            }
          />

          <div className="space-y-4">
            <SectionCard
              title="Details"
              description="Project name, client contact, and scope notes."
              headerRight={<ProjectStatusBadge status={current.status} />}
            >
              <label className="ui-label">Project name</label>
              <input
                value={current.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="e.g. MDRRMO Drone Delivery"
                className="ui-input !h-10 !text-[15px] !font-semibold"
              />

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="ui-label">Client contact</label>
                  <input
                    value={current.clientName}
                    onChange={(e) => patch({ clientName: e.target.value })}
                    placeholder="Contact person"
                    className="ui-input"
                  />
                </div>
                <div>
                  <label className="ui-label">Client office</label>
                  <input
                    value={current.clientOffice}
                    onChange={(e) => patch({ clientOffice: e.target.value })}
                    placeholder="Office / agency"
                    className="ui-input"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="ui-label">Description</label>
                <textarea
                  value={current.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  rows={3}
                  placeholder="Scope, notes, or delivery context"
                  className="ui-textarea min-h-[84px] resize-y"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Progress & schedule"
              description="Completion percentage, current status, and key dates."
              headerRight={
                <span className="ui-num text-lg font-bold" style={{ color }}>
                  {pct}%
                </span>
              }
            >
              <div className="mb-6">
                <label className="ui-label">Completion</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  onChange={(e) => handleProgressChange(parseFloat(e.target.value))}
                  className="w-full"
                  style={{ accentColor: color }}
                  aria-label="Completion percentage"
                />
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--line-soft)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-200"
                    style={progressFillStyle(pct)}
                  />
                </div>
                <div className="mt-4 max-w-[130px]">
                  <label className="ui-label">Exact %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={pct}
                    onChange={(e) => handleProgressChange(parseFloat(e.target.value))}
                    className="ui-input ui-num"
                  />
                </div>
              </div>

              <div>
                <label className="ui-label">Project status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      aria-pressed={current.status === status}
                      className={`ui-chip ${current.status === status ? "ui-chip-active" : ""}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="ui-label">Start date</label>
                  <input
                    type="date"
                    value={current.startDate}
                    onChange={(e) => patch({ startDate: e.target.value })}
                    className="ui-input"
                  />
                </div>
                <div>
                  <label className="ui-label">Target date</label>
                  <input
                    type="date"
                    value={current.targetDate}
                    onChange={(e) => patch({ targetDate: e.target.value })}
                    className="ui-input"
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
