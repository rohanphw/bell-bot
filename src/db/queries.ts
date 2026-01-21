import { db } from "./schema";
import type { Message, Summary, UserProfile, PendingFollowup } from "../types";

// Messages
export function saveMessage(
  chatId: number,
  role: "user" | "assistant",
  content: string,
): void {
  db.prepare(
    "INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)",
  ).run(chatId, role, content);
}

export function getRecentMessages(chatId: number, limit = 20): Message[] {
  const rows = db
    .prepare(
      `SELECT id, chat_id as chatId, role, content, created_at as createdAt 
       FROM messages 
       WHERE chat_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
    )
    .all(chatId, limit) as Message[];

  return rows.reverse();
}

// Summaries
export function saveSummary(
  chatId: number,
  type: "daily" | "weekly",
  content: string,
  periodStart: Date,
  periodEnd: Date,
): void {
  db.prepare(
    `INSERT INTO summaries (chat_id, type, content, period_start, period_end) 
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    chatId,
    type,
    content,
    periodStart.toISOString(),
    periodEnd.toISOString(),
  );
}

export function getSummaries(chatId: number, limit = 5): Summary[] {
  return db
    .prepare(
      `SELECT id, chat_id as chatId, type, content, 
              period_start as periodStart, period_end as periodEnd, 
              created_at as createdAt
       FROM summaries 
       WHERE chat_id = ? 
       ORDER BY period_end DESC 
       LIMIT ?`,
    )
    .all(chatId, limit) as Summary[];
}

// User Profile
export function getOrCreateProfile(chatId: number): UserProfile {
  const existing = db
    .prepare(
      "SELECT chat_id as chatId, facts, updated_at as updatedAt FROM user_profiles WHERE chat_id = ?",
    )
    .get(chatId) as
    | { chatId: number; facts: string; updatedAt: string }
    | undefined;

  if (existing) {
    return {
      chatId: existing.chatId,
      facts: JSON.parse(existing.facts),
      updatedAt: new Date(existing.updatedAt),
    };
  }

  db.prepare("INSERT INTO user_profiles (chat_id) VALUES (?)").run(chatId);
  return { chatId, facts: {}, updatedAt: new Date() };
}

export function updateProfileFacts(
  chatId: number,
  facts: Record<string, string>,
): void {
  db.prepare(
    "UPDATE user_profiles SET facts = ?, updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?",
  ).run(JSON.stringify(facts), chatId);
}

// Pending Followups
export function addFollowup(
  chatId: number,
  topic: string,
  triggerAt: Date,
): void {
  db.prepare(
    "INSERT INTO pending_followups (chat_id, topic, trigger_at) VALUES (?, ?, ?)",
  ).run(chatId, topic, triggerAt.toISOString());
}

export function getDueFollowups(): PendingFollowup[] {
  return db
    .prepare(
      `SELECT id, chat_id as chatId, topic, trigger_at as triggerAt, 
              completed, created_at as createdAt
       FROM pending_followups 
       WHERE completed = 0 AND trigger_at <= datetime('now')
       ORDER BY trigger_at ASC`,
    )
    .all() as PendingFollowup[];
}

export function markFollowupComplete(id: number): void {
  db.prepare("UPDATE pending_followups SET completed = 1 WHERE id = ?").run(id);
}

export function getPendingFollowups(chatId: number): PendingFollowup[] {
  return db
    .prepare(
      `SELECT id, chat_id as chatId, topic, trigger_at as triggerAt, 
              completed, created_at as createdAt
       FROM pending_followups 
       WHERE chat_id = ? AND completed = 0
       ORDER BY trigger_at ASC`,
    )
    .all(chatId) as PendingFollowup[];
}

export function clearChatData(chatId: number): void {
  db.prepare("DELETE FROM messages WHERE chat_id = ?").run(chatId);
  db.prepare("DELETE FROM summaries WHERE chat_id = ?").run(chatId);
  db.prepare("DELETE FROM user_profiles WHERE chat_id = ?").run(chatId);
  db.prepare("DELETE FROM pending_followups WHERE chat_id = ?").run(chatId);
}
