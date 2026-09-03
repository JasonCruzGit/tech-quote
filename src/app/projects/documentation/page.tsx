"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import ListPageChrome from "@/components/ui/ListPageChrome";
import SortableTh from "@/components/ui/SortableTh";
import StatStrip, { type Stat } from "@/components/ui/StatStrip";
import { ProjectStatusBadge } from "@/components/ui/StatusBadge";
import { SearchInput } from "@/components/ui/Toolbar";
import { documentProgress, useDocuments, useDocumentsLoadState } from "@/lib/documentsStore";
import { useProjects, useProjectsLoadState } from "@/lib/projectsStore";
import { progressColor, progressFillStyle } from "@/lib/progress";
import { useTableSort } from "@/lib/useTableSort";

type DocSortKey = "project" | "client" | "status" | "documents" | "completion";

export default function DocumentationPage() {
  const projects = useProjects();
  const documents = useDocuments();
  const projectsLoad = useProjectsLoadState();
  const docsLoad = useDocumentsLoadState();
  const [query, setQuery] = useState("");

  const byProject = useMemo(() => {
    const map = new Map<string, typeof documents>();
    for (const doc of documents) {
      const list = map.get(doc.projectId);
      if (list) list.push(doc);
      else map.set(doc.projectId, [doc]);
    }
    return map;
  }, [documents]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.clientOffice.toLowerCase().includes(q)
        );
      })
      .map((project) => {
        const docs = byProject.get(project.id) ?? [];
        return { project, docs, progress: documentProgress(docs) };
      });
  }, [projects, byProject, query]);

  const { sorted, sort, toggle } = useTableSort<(typeof rows)[number], DocSortKey>(
    rows,
    (row, key) => {
      switch (key) {
        case "project":
          return row.project.name;
        case "client":
          return row.project.clientName || row.project.clientOffice;
        case "status":
          return row.project.status;
        case "documents":
          return row.docs.length;
        case "completion":
          return row.docs.length === 0 ? null : row.progress.pct;
      }
    },
    { key: "project", dir: "asc" }
  );

  const stats: Stat[] = useMemo(() => {
    const tracked = projects.filter((p) => (byProject.get(p.id) ?? []).length > 0);
    const attached = documents.filter((d) => Boolean(d.storedName));
    const missingFile = documents.filter((d) => !d.storedName && d.status !== "Not applicable");
    const complete = tracked.filter((p) => {
      const docs = byProject.get(p.id) ?? [];
      return docs.length > 0 && docs.every((d) => Boolean(d.storedName));
    }).length;
    return [
      {
        label: "Projects tracked",
        value: `${tracked.length}`,
        hint: `${projects.length - tracked.length} without documents`,
      },
      { label: "Documents", value: String(documents.length) },
      {
        label: "Files attached",
        value: String(attached.length),
        hint: `${missingFile.length} still need a file`,
      },
      { label: "Fully documented", value: String(complete) },
    ];
  }, [projects, documents, byProject]);

  const isLoading =
    projectsLoad === "idle" ||
    projectsLoad === "loading" ||
    docsLoad === "idle" ||
    docsLoad === "loading";

  return (
    <AppShell>
      <ListPageChrome
        title="Documentation"
        description="Attach papers and certifications required for each project."
        stats={<StatStrip stats={stats} />}
        toolbar={
          <SearchInput value={query} onChange={setQuery} placeholder="Search projects" />
        }
        cardMeta={
          <span className="ui-num text-xs text-[var(--ink-500)]">
            {rows.length} project{rows.length === 1 ? "" : "s"}
          </span>
        }
      >
        <div className="ui-table-scroll">
          <table className="ui-table ui-table-fixed min-w-[920px]">
            <colgroup>
              <col className="w-[268px]" />
              <col className="w-[212px]" />
              <col className="w-[124px]" />
              <col className="w-[110px]" />
              <col className="w-[168px]" />
              <col className="w-[96px]" />
            </colgroup>
            <thead>
              <tr>
                <SortableTh columnKey="project" label="Project" sort={sort} onSort={toggle} />
                <SortableTh columnKey="client" label="Client" sort={sort} onSort={toggle} />
                <SortableTh
                  columnKey="status"
                  label="Project Status"
                  sort={sort}
                  onSort={toggle}
                />
                <SortableTh
                  columnKey="documents"
                  label="Documents"
                  sort={sort}
                  onSort={toggle}
                  align="right"
                  className="ui-num-cell"
                />
                <SortableTh
                  columnKey="completion"
                  label="Completion"
                  sort={sort}
                  onSort={toggle}
                />
                <th className="ui-col-actions text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ project, docs, progress }) => {
                const title = project.name.trim() || "Untitled project";
                const client = project.clientName.trim() || "—";
                const office = project.clientOffice.trim();
                return (
                  <tr key={project.id}>
                    <td>
                      <Link
                        href={`/projects/documentation/${project.id}`}
                        className="ui-link block truncate"
                        title={title}
                      >
                        {title}
                      </Link>
                      {project.quoteNumber ? (
                        <p className="ui-cell-sub">From {project.quoteNumber}</p>
                      ) : null}
                    </td>
                    <td>
                      <p className="ui-cell-strong" title={client}>
                        {client}
                      </p>
                      {office ? (
                        <p className="ui-cell-sub" title={office}>
                          {office}
                        </p>
                      ) : null}
                    </td>
                    <td>
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td className="ui-num-cell">
                      {docs.length === 0 ? (
                        <span className="text-[var(--ink-300)]">None</span>
                      ) : (
                        `${progress.attached} / ${docs.length}`
                      )}
                    </td>
                    <td>
                      {docs.length === 0 ? (
                        <span className="ui-badge ui-badge-warn">No documents</span>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--line-soft)]">
                            <div
                              className="h-full rounded-full"
                              style={progressFillStyle(
                                Math.round((progress.attached / docs.length) * 100)
                              )}
                            />
                          </div>
                          <span
                            className="ui-num w-8 shrink-0 text-right text-[11px] font-bold"
                            style={{
                              color: progressColor(
                                Math.round((progress.attached / docs.length) * 100)
                              ),
                            }}
                          >
                            {Math.round((progress.attached / docs.length) * 100)}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="ui-col-actions">
                      <div className="ui-row-actions">
                        <Link
                          href={`/projects/documentation/${project.id}`}
                          className="ui-btn ui-btn-sm ui-btn-ghost"
                        >
                          {docs.length === 0 ? "Attach" : "Open"}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="!h-auto !p-0">
                    <EmptyState
                      title={
                        isLoading
                          ? "Loading documentation…"
                          : query.trim()
                            ? "No projects match your search"
                            : "No projects yet"
                      }
                      description={
                        isLoading
                          ? undefined
                          : "Projects appear here once a quotation is won or a bid is awarded."
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ListPageChrome>
    </AppShell>
  );
}
