"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import ListPageChrome from "@/components/ui/ListPageChrome";
import SortableTh from "@/components/ui/SortableTh";
import StatStrip, { type Stat } from "@/components/ui/StatStrip";
import { CreateButton, SearchInput } from "@/components/ui/Toolbar";
import { USER_ROLES, type PublicUser, type UserRole } from "@/lib/types";
import { useTableSort } from "@/lib/useTableSort";

type SortKey = "name" | "username" | "email" | "role" | "createdAt";

function formatCreatedAt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PH", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

const emptyForm = {
  name: "",
  username: "",
  email: "",
  role: "Staff" as UserRole,
  password: "",
  confirmPassword: "",
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = useCallback(async () => {
    setLoadState("loading");
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data = (await res.json()) as { users: PublicUser[] };
      setUsers(data.users ?? []);
      setLoadState("loaded");
    } catch (err) {
      console.error(err);
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, query]);

  const { sorted, sort, toggle } = useTableSort<PublicUser, SortKey>(
    filtered,
    (row, key) => {
      switch (key) {
        case "name":
          return row.name;
        case "username":
          return row.username;
        case "email":
          return row.email;
        case "role":
          return row.source === "env" ? "System admin" : row.role;
        case "createdAt":
          return row.createdAt || null;
      }
    },
    { key: "name", dir: "asc" }
  );

  const stats: Stat[] = useMemo(() => {
    const dbCount = users.filter((u) => u.source === "database").length;
    return [
      { label: "Total accounts", value: String(users.length) },
      { label: "App users", value: String(dbCount) },
      {
        label: "System admin",
        value: users.some((u) => u.source === "env") ? "1" : "0",
        hint: "From environment variables",
      },
    ];
  }, [users]);

  function patchForm<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setFormError("");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          role: form.role,
          password: form.password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        user?: PublicUser;
        error?: string;
      };
      if (!res.ok) {
        setFormError(data.error || "Unable to create user.");
        return;
      }
      if (data.user) setUsers((prev) => [...prev, data.user!]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setFormError("Unable to create user. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: PublicUser) {
    if (user.source === "env") return;
    const label = user.name.trim() || user.username;
    if (!window.confirm(`Remove account "${label}"? They will no longer be able to sign in.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        window.alert(data.error || "Failed to delete user.");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
      window.alert("Failed to delete user.");
    }
  }

  async function handleResetPassword(user: PublicUser) {
    if (user.source === "env") return;
    if (newPassword.length < 8) {
      window.alert("Password must be at least 8 characters.");
      return;
    }
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        window.alert(data.error || "Failed to update password.");
        return;
      }
      setResetPasswordId(null);
      setNewPassword("");
      window.alert(`Password updated for ${user.username}.`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to update password.");
    }
  }

  const isLoading = loadState === "loading";

  return (
    <AppShell>
      <ListPageChrome
        title="Manage Users"
        description="Create and manage accounts that can sign in to the quotation system."
        stats={<StatStrip stats={stats} />}
        toolbar={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder="Search users" />
            {showForm ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="ui-btn ui-btn-ghost"
              >
                Cancel
              </button>
            ) : (
              <CreateButton onClick={() => setShowForm(true)} label="Add User" />
            )}
          </>
        }
        cardMeta={
          <span className="ui-num text-xs text-[var(--ink-500)]">
            {filtered.length} user{filtered.length === 1 ? "" : "s"}
          </span>
        }
      >
        {showForm ? (
          <form
            onSubmit={handleCreate}
            className="border-b border-[var(--line)] bg-[var(--surface-sub)] px-5 py-4"
          >
            <p className="mb-3 text-sm font-semibold text-[var(--ink-800)]">New user</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="ui-label" htmlFor="user-name">
                  Full name
                </label>
                <input
                  id="user-name"
                  value={form.name}
                  onChange={(e) => patchForm("name", e.target.value)}
                  className="ui-input"
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>
              <div>
                <label className="ui-label" htmlFor="user-username">
                  Username
                </label>
                <input
                  id="user-username"
                  value={form.username}
                  onChange={(e) => patchForm("username", e.target.value)}
                  className="ui-input"
                  placeholder="jdelacruz"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label className="ui-label" htmlFor="user-email">
                  Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => patchForm("email", e.target.value)}
                  className="ui-input"
                  placeholder="juan@company.com"
                />
              </div>
              <div>
                <label className="ui-label" htmlFor="user-role">
                  Role
                </label>
                <select
                  id="user-role"
                  value={form.role}
                  onChange={(e) => patchForm("role", e.target.value as UserRole)}
                  className="ui-input"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ui-label" htmlFor="user-password">
                  Password
                </label>
                <input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => patchForm("password", e.target.value)}
                  className="ui-input"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="ui-label" htmlFor="user-confirm-password">
                  Confirm password
                </label>
                <input
                  id="user-confirm-password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => patchForm("confirmPassword", e.target.value)}
                  className="ui-input"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
            </div>
            {formError ? (
              <p className="mt-2 text-sm text-[var(--danger)]">{formError}</p>
            ) : null}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="ui-btn ui-btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="ui-btn ui-btn-primary">
                {saving ? "Creating…" : "Create user"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="ui-table-scroll">
          <table className="ui-table ui-table-fixed min-w-[860px]">
            <colgroup>
              <col className="w-[220px]" />
              <col className="w-[140px]" />
              <col className="w-[200px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
              <col className="w-[180px]" />
            </colgroup>
            <thead>
              <tr>
                <SortableTh columnKey="name" label="Name" sort={sort} onSort={toggle} />
                <SortableTh columnKey="username" label="Username" sort={sort} onSort={toggle} />
                <SortableTh columnKey="email" label="Email" sort={sort} onSort={toggle} />
                <SortableTh columnKey="role" label="Role" sort={sort} onSort={toggle} />
                <SortableTh
                  columnKey="createdAt"
                  label="Created"
                  sort={sort}
                  onSort={toggle}
                />
                <th className="ui-col-actions text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((user) => (
                <tr key={user.id}>
                  <td>
                    <p className="ui-cell-strong truncate" title={user.name}>
                      {user.name.trim() || "—"}
                    </p>
                  </td>
                  <td className="ui-num font-medium text-[var(--ink-800)]">{user.username}</td>
                  <td className="truncate text-[13px] text-[var(--ink-700)]" title={user.email}>
                    {user.email.trim() || "—"}
                  </td>
                  <td>
                    {user.source === "env" ? (
                      <span className="ui-badge ui-badge-neutral">System admin</span>
                    ) : (
                      <span className="ui-badge ui-badge-ok">{user.role}</span>
                    )}
                  </td>
                  <td className="ui-num-cell">{formatCreatedAt(user.createdAt)}</td>
                  <td className="ui-col-actions">
                    {user.source === "env" ? (
                      <span className="text-xs text-[var(--ink-400)]">Env credentials</span>
                    ) : resetPasswordId === user.id ? (
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="ui-input ui-input-compact !w-32"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => void handleResetPassword(user)}
                          className="ui-btn ui-btn-sm ui-btn-primary"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetPasswordId(null);
                            setNewPassword("");
                          }}
                          className="ui-btn ui-btn-sm ui-btn-ghost"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="ui-row-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setResetPasswordId(user.id);
                            setNewPassword("");
                          }}
                          className="ui-btn ui-btn-sm ui-btn-ghost"
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(user)}
                          className="ui-btn ui-btn-sm ui-btn-danger"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="!h-auto !p-0">
                    <EmptyState
                      title={
                        isLoading
                          ? "Loading users…"
                          : loadState === "error"
                            ? "Couldn't load users"
                            : query.trim()
                              ? "No users match your search"
                              : "No users yet"
                      }
                      description={
                        isLoading
                          ? undefined
                          : loadState === "error"
                            ? "Refresh the page and try again."
                            : "Add a user so teammates can sign in with their own account."
                      }
                      action={
                        !isLoading && loadState === "loaded" && !query.trim() ? (
                          <CreateButton
                            onClick={() => {
                              resetForm();
                              setShowForm(true);
                            }}
                            label="Add User"
                          />
                        ) : undefined
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
