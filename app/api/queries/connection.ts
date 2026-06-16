import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import path from "path";
import fs from "fs";

const fullSchema = { ...schema, ...relations };

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.resolve(DB_DIR, "finance.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
// Enable WAL mode for better concurrency
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema: fullSchema });

export function getDb() {
  return db;
}
