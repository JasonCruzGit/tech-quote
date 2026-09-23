import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import db, { schedulePersist } from "@/lib/server/db";
import type { PublicUser, UserRole } from "@/lib/types";
import { USER_ROLES } from "@/lib/types";

export type { PublicUser };

export interface DbUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}

const USER_SELECT =
  `SELECT id, username, name,
          COALESCE(email, '') AS email,
          COALESCE(role, 'Staff') AS role,
          passwordHash, createdAt
   FROM users`;

export function normalizeRole(value: unknown): UserRole {
  const raw = String(value ?? "").trim();
  return (USER_ROLES as readonly string[]).includes(raw)
    ? (raw as UserRole)
    : "Staff";
}

export function toPublicUser(user: DbUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email ?? "",
    role: normalizeRole(user.role),
    createdAt: user.createdAt,
    source: "database",
  };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

export function findUserByUsername(username: string): DbUser | null {
  const row = db
    .prepare(`${USER_SELECT} WHERE username = ? COLLATE NOCASE`)
    .get(username.trim()) as DbUser | undefined;
  return row ?? null;
}

export function findUserById(id: string): DbUser | null {
  const row = db.prepare(`${USER_SELECT} WHERE id = ?`).get(id) as DbUser | undefined;
  return row ?? null;
}

export function listUsers(): DbUser[] {
  return db.prepare(`${USER_SELECT} ORDER BY createdAt DESC`).all() as DbUser[];
}

export function createUser(input: {
  username: string;
  name: string;
  password: string;
  email?: string;
  role?: UserRole;
}): DbUser {
  const username = input.username.trim().toLowerCase();
  const name = input.name.trim();
  const email = input.email?.trim() ?? "";
  const role = normalizeRole(input.role);
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const passwordHash = hashPassword(input.password);

  db.prepare(
    `INSERT INTO users (id, username, name, email, title, phone, role, passwordHash, createdAt)
     VALUES (?, ?, ?, ?, '', '', ?, ?, ?)`
  ).run(id, username, name, email, role, passwordHash, createdAt);
  schedulePersist();

  return { id, username, name, email, role, passwordHash, createdAt };
}

export function updateUser(
  id: string,
  patch: {
    name?: string;
    email?: string;
    role?: UserRole;
    password?: string;
  }
): DbUser | null {
  const existing = findUserById(id);
  if (!existing) return null;

  const name = patch.name?.trim() || existing.name;
  const email = patch.email !== undefined ? patch.email.trim() : existing.email;
  const role = patch.role !== undefined ? normalizeRole(patch.role) : existing.role;
  const passwordHash =
    patch.password && patch.password.length > 0
      ? hashPassword(patch.password)
      : existing.passwordHash;

  db.prepare(
    `UPDATE users SET name = ?, email = ?, role = ?, passwordHash = ?
     WHERE id = ?`
  ).run(name, email, role, passwordHash, id);
  schedulePersist();

  return { ...existing, name, email, role, passwordHash };
}

export function deleteUser(id: string): boolean {
  const result = db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  if (result.changes > 0) schedulePersist();
  return result.changes > 0;
}
