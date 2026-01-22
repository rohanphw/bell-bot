import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { env } from "../config/env";

// Ensure data directory exists
if (!fs.existsSync(env.DATA_DIR)) {
  fs.mkdirSync(env.DATA_DIR, { recursive: true });
}

const dbPath = path.join(env.DATA_DIR, "bellbot.db");

console.log(`Database path: ${dbPath}`);
console.log(`Database exists: ${fs.existsSync(dbPath)}`);

export const db = new Database(dbPath);

export function initializeDb(): void {
  // Log existing tables
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all();
  console.log("Existing tables:", tables);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
      content TEXT NOT NULL,
      period_start DATETIME NOT NULL,
      period_end DATETIME NOT NULL,w
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      chat_id INTEGER PRIMARY KEY,
      facts TEXT NOT NULL DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pending_followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      trigger_at DATETIME NOT NULL,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_summaries_chat_id ON summaries(chat_id);
    CREATE INDEX IF NOT EXISTS idx_followups_trigger ON pending_followups(trigger_at, completed);
  `);

  const messageCount = db
    .prepare("SELECT COUNT(*) as count FROM messages")
    .get() as { count: number };
  console.log(`Total messages in database: ${messageCount.count}`);
}
