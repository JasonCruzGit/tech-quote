"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import ListPageChrome from "@/components/ui/ListPageChrome";
import Pagination from "@/components/ui/Pagination";
import RowMenu from "@/components/ui/RowMenu";
import SortableTh from "@/components/ui/SortableTh";
import StatStrip, { type Stat } from "@/components/ui/StatStrip";
import ProjectStatusPicker from "@/components/ui/ProjectStatusPicker";
import { PencilIcon } from "@/components/ui/Icons";
import {
  CreateButton,
  ExportButton,
  FilterButton,
  FilterChips,
  SearchInput,
} from "@/components/ui/Toolbar";
import { formatDateLong, todayIso } from "@/lib/format";
import { clampProgressPct, progressColor, progressFillStyle } from "@/lib/progress";
import {
  createProject,
  deleteProject,
  updateProject,
  useProjects,
  useProjectsLoadState,
} from "@/lib/projectsStore";
import type { Project, ProjectStatus } from "@/lib/types";
import { useTableSort } from "@/lib/useTableSort";

const PAGE_SIZE = 11;

const STATUS_FILTERS = ["All", "Ongoing", "Planning", "On Hold", "Completed"] as const;

type ProjectSortKey = "name" | "client" | "start" | "target" | "status" | "progress";

function ProgressCell({ pct }: { pct: number }) {
  const value = clampProgressPct(pct);
  return (
    <div className="flex min-w-[150px] items-center gap-2.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--line-soft)]">
        <div className="h-full rounded-full" style={progressFillStyle(value)} />
      </div>
      <span
        className="ui-num w-8 shrink-0 text-right text-[11px] font-bold"
        style={{ color: progressColor(value) }}
      >
        {value}%
      </span>
    </div>
  );
}

function exportCsv(projects: Project[]) {
  const headers = [
    "Project",
    "Client",
    "Office",
    "Start Date",
    "Target Date",
    "Status",
    "Progress %",
    "Quote No",
    "Description",
  ];
  const rows = projects.map((p) =>
    [
      p.name,
      p.clientName,
      p.clientOffice,
      p.startDate,
      p.targetDate,
      p.status,
      String(clampProgressPct(p.progressPct)),
      p.quoteNumber ?? "",
      p.description,
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
  );
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `projects-status-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProjectsStatusPage() {
  const projects = useProjects();
  const loadState = useProjectsLoadState();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((project) => {
      if (statusFilter !== "All" && project.status !== statusFilter) return false;
      if (!q) return true;
      return (
        project.name.toLowerCase().includes(q) ||
        project.clientName.toLowerCase().includes(q) ||
        project.clientOffice.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        (project.quoteNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [projects, query, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: projects.length,
      Planning: 0,
      Ongoing: 0,
      "On Hold": 0,
      Completed: 0,
    };
    for (const p of projects) counts[p.status] += 1;
    return counts;
  }, [projects]);

  const stats: Stat[] = useMemo(() => {
    const active = projects.filter((p) => p.status === "Ongoing");
    const avgProgress =
      active.length === 0
        ? 0
        : Math.round(
            active.reduce((sum, p) => sum + clampProgressPct(p.progressPct), 0) / active.length
          );
    // ISO dates compare correctly as strings and avoid UTC-vs-local drift.
    const today = todayIso();
    const overdue = projects.filter((p) => {
      if (!p.targetDate || p.status === "Completed") return false;
      return p.targetDate < today;
    }).length;
    return [
      { label: "Total projects", value: String(projects.length) },
      {
        label: "Ongoing",
        value: String(statusCounts.Ongoing ?? 0),
        hint: `${avgProgress}% average progress`,
      },
      {
        label: "Completed",
        value: String(statusCounts.Completed ?? 0),
        hint: `${statusCounts["On Hold"] ?? 0} on hold`,
      },
      {
        label: "Past target date",
        value: String(overdue),
        hint: overdue > 0 ? "Requires attention" : "All on schedule",
      },
    ];
  }, [projects, statusCounts]);

  const { sorted, sort, toggle } = useTableSort<Project, ProjectSortKey>(
    filtered,
    (project, key) => {
      switch (key) {
        case "name":
          return project.name;
        case "client":
          return project.clientName || project.clientOffice;
        case "start":
          return project.startDate;
        case "target":
          return project.targetDate;
        case "status":
          return project.status;
        case "progress":
          return clampProgressPct(project.progressPct);
      }
    },
    { key: "target", dir: "asc" }
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const allPageSelected = pageRows.length > 0 && pageRows.every((p) => selected.has(p.id));

  function toggleAllPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const p of pageRows) next.delete(p.id);
      } else {
        for (const p of pageRows) next.add(p.id);
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddProject() {
    setIsCreating(true);
    try {
      const project = await createProject();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  function handleStatusChange(project: Project, status: ProjectStatus) {
    updateProject(project.id, (current) => {
      if (status === "Completed") {
        return { ...current, status, progressPct: 100 };
      }
      return { ...current, status };
    });
  }

  function handleDelete(project: Project) {
    const label = project.name.trim() || "Untitled project";
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      deleteProject(project.id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(project.id);
        return next;
      });
    }
  }

  function handleExport() {
    const rows = selected.size > 0 ? projects.filter((p) => selected.has(p.id)) : filtered;
    if (rows.length === 0) {
      window.alert("No projects to export.");
      return;
    }
    exportCsv(rows);
  }

  const isLoading = loadState === "loading" || loadState === "idle";

  return (
    <AppShell>
      <ListPageChrome
        title="Monitoring/Status"
        description="Track delivery progress, schedules, and status across all awarded projects."
        stats={<StatStrip stats={stats} />}
        toolbar={
          <>
            <SearchInput
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder="Search projects"
            />
            <FilterButton
              active={showFilters || statusFilter !== "All"}
              onClick={() => setShowFilters((v) => !v)}
            />
            <ExportButton onClick={handleExport} />
            <CreateButton onClick={handleAddProject} disabled={isCreating} label="New Project" />
          </>
        }
        filters={
          showFilters ? (
            <FilterChips
              options={STATUS_FILTERS}
              value={statusFilter}
              counts={statusCounts}
              onChange={(next) => {
                setStatusFilter(next);
                setPage(1);
              }}
            />
          ) : null
        }
        cardMeta={
          <span className="ui-num text-xs text-[var(--ink-500)]">
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
            {selected.size > 0 ? (
              <span className="ml-2 font-semibold text-[var(--brand)]">
                {selected.size} selected
              </span>
            ) : null}
          </span>
        }
      >
        <div className="ui-table-scroll">
          <table className="ui-table ui-table-fixed min-w-[1010px]">
            <colgroup>
              <col className="w-[40px]" />
              <col className="w-[236px]" />
              <col className="w-[196px]" />
              <col className="w-[96px]" />
              <col className="w-[96px]" />
              <col className="w-[104px]" />
              <col className="w-[164px]" />
              <col className="w-[78px]" />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleAllPage}
                    aria-label="Select all on page"
                    className="ui-checkbox"
                  />
                </th>
                <SortableTh columnKey="name" label="Project" sort={sort} onSort={toggle} />
                <SortableTh columnKey="client" label="Client" sort={sort} onSort={toggle} />
                <SortableTh columnKey="start" label="Start" sort={sort} onSort={toggle} />
                <SortableTh columnKey="target" label="Target" sort={sort} onSort={toggle} />
                <SortableTh columnKey="status" label="Status" sort={sort} onSort={toggle} />
                <SortableTh columnKey="progress" label="Progress" sort={sort} onSort={toggle} />
                <th className="ui-col-actions text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((project) => {
                const title = project.name.trim() || "Untitled project";
                const clientName = project.clientName.trim() || "—";
                const office = project.clientOffice.trim();
                const sub = project.quoteNumber
                  ? `From ${project.quoteNumber}`
                  : project.description.trim();
                const isSelected = selected.has(project.id);
                return (
                  <tr key={project.id} className={isSelected ? "ui-row-selected" : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(project.id)}
                        aria-label={`Select ${title}`}
                        className="ui-checkbox"
                      />
                    </td>
                    <td>
                      <Link
                        href={`/projects/${project.id}`}
                        className="ui-link block truncate"
                        title={title}
                      >
                        {title}
                      </Link>
                      {sub ? (
                        <p className="ui-cell-sub" title={sub}>
                          {sub}
                        </p>
                      ) : null}
                    </td>
                    <td>
                      <p className="ui-cell-strong" title={clientName}>
                        {clientName}
                      </p>
                      {office ? (
                        <p className="ui-cell-sub" title={office}>
                          {office}
                        </p>
                      ) : null}
                    </td>
                    <td className="ui-truncate">
                      {project.startDate ? formatDateLong(project.startDate) : "—"}
                    </td>
                    <td className="ui-truncate">
                      {project.targetDate ? formatDateLong(project.targetDate) : "—"}
                    </td>
                    <td>
                      <ProjectStatusPicker
                        status={project.status}
                        label={`Change status for ${title}`}
                        onChange={(status) => handleStatusChange(project, status)}
                      />
                    </td>
                    <td>
                      <ProgressCell pct={project.progressPct} />
                    </td>
                    <td className="ui-col-actions">
                      <div className="ui-row-actions">
                        <Link
                          href={`/projects/${project.id}`}
                          className="ui-icon-btn ui-icon-btn-bare"
                          aria-label={`Open ${title}`}
                          title="Open project"
                        >
                          <PencilIcon size={14} />
                        </Link>
                        <RowMenu
                          actions={[
                            {
                              key: "edit",
                              label: "Edit project",
                              href: `/projects/${project.id}`,
                            },
                            {
                              key: "documents",
                              label: "Documentation",
                              href: `/projects/documentation/${project.id}`,
                            },
                            {
                              key: "delete",
                              label: "Delete",
                              danger: true,
                              separated: true,
                              onSelect: () => handleDelete(project),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="!h-auto !p-0">
                    <EmptyState
                      title={
                        isLoading
                          ? "Loading projects…"
                          : loadState === "error"
                            ? "Couldn't load projects"
                            : "No projects found"
                      }
                      description={
                        loadState === "error"
                          ? "Please refresh the page to try again."
                          : isLoading
                            ? undefined
                            : "Projects appear here once a quotation is marked as won."
                      }
                      action={
                        loadState === "loaded" ? (
                          <button
                            type="button"
                            onClick={handleAddProject}
                            className="ui-btn ui-btn-primary"
                          >
                            New Project
                          </button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <Pagination
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={filtered.length}
            pageCount={pageCount}
            currentPage={currentPage}
            onPageChange={setPage}
            meta={
              selected.size > 0 ? (
                <span className="ml-2 font-semibold text-[var(--brand)]">
                  · {selected.size} selected
                </span>
              ) : null
            }
          />
        )}
      </ListPageChrome>
    </AppShell>
  );
}
