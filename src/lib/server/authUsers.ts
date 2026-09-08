import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import db from "@/lib/server/db";

export interface DbUser {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  createdAt: string;
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
    .prepare(
      `SELECT id, username, name, passwordHash, createdAt
       FROM users WHERE username = ? COLLATE NOCASE`
    )
    .get(username.trim()) as DbUser | undefined;
  return row ?? null;
}

export function createUser(input: {
  username: string;
  name: string;
  password: string;
}): DbUser {
  const username = input.username.trim().toLowerCase();
  const name = input.name.trim();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const passwordHash = hashPassword(input.password);

  db.prepare(
    `INSERT INTO users (id, username, name, passwordHash, createdAt)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, username, name, passwordHash, createdAt);

  return { id, username, name, passwordHash, createdAt };
}
