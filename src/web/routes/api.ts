import { Router } from "express";
import { db } from "../../db";

const router = Router();

// Get all chats
router.get("/chats", (req, res) => {
  const chats = db
    .prepare(
      `
    SELECT 
      chat_id as chatId,
      COUNT(*) as messageCount,
      MAX(created_at) as lastMessage
    FROM messages
    GROUP BY chat_id
    ORDER BY lastMessage DESC
  `,
    )
    .all();

  res.json(chats);
});

// Get chat detail
router.get("/chats/:id", (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const messageCount = db
    .prepare("SELECT COUNT(*) as count FROM messages WHERE chat_id = ?")
    .get(chatId) as { count: number };

  const summaryCount = db
    .prepare("SELECT COUNT(*) as count FROM summaries WHERE chat_id = ?")
    .get(chatId) as { count: number };

  const followupCount = db
    .prepare(
      "SELECT COUNT(*) as count FROM pending_followups WHERE chat_id = ? AND completed = 0",
    )
    .get(chatId) as { count: number };

  const profile = db
    .prepare("SELECT facts FROM user_profiles WHERE chat_id = ?")
    .get(chatId) as { facts: string } | undefined;

  res.json({
    chatId,
    messageCount: messageCount.count,
    summaryCount: summaryCount.count,
    pendingFollowups: followupCount.count,
    profile: profile ? JSON.parse(profile.facts) : {},
  });
});

// Get messages for a chat
router.get("/chats/:id/messages", (req, res) => {
  const chatId = parseInt(req.params.id, 10);
  const limit = parseInt(req.query.limit as string, 10) || 50;

  const messages = db
    .prepare(
      `
    SELECT id, role, content, created_at as createdAt
    FROM messages
    WHERE chat_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `,
    )
    .all(chatId, limit);

  res.json(messages.reverse());
});

// Get summaries for a chat
router.get("/chats/:id/summaries", (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const summaries = db
    .prepare(
      `
    SELECT id, type, content, period_start as periodStart, period_end as periodEnd, created_at as createdAt
    FROM summaries
    WHERE chat_id = ?
    ORDER BY created_at DESC
  `,
    )
    .all(chatId);

  res.json(summaries);
});

// Get profile for a chat
router.get("/chats/:id/profile", (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const profile = db
    .prepare(
      "SELECT facts, updated_at as updatedAt FROM user_profiles WHERE chat_id = ?",
    )
    .get(chatId) as { facts: string; updatedAt: string } | undefined;

  if (!profile) {
    res.json({ facts: {}, updatedAt: null });
    return;
  }

  res.json({
    facts: JSON.parse(profile.facts),
    updatedAt: profile.updatedAt,
  });
});

// Get followups for a chat
router.get("/chats/:id/followups", (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const followups = db
    .prepare(
      `
    SELECT id, topic, trigger_at as triggerAt, completed, created_at as createdAt
    FROM pending_followups
    WHERE chat_id = ?
    ORDER BY trigger_at DESC
  `,
    )
    .all(chatId);

  res.json(followups);
});

// Get overall stats
router.get("/stats", (req, res) => {
  const totalChats = db
    .prepare("SELECT COUNT(DISTINCT chat_id) as count FROM messages")
    .get() as { count: number };
  const totalMessages = db
    .prepare("SELECT COUNT(*) as count FROM messages")
    .get() as { count: number };
  const totalSummaries = db
    .prepare("SELECT COUNT(*) as count FROM summaries")
    .get() as { count: number };
  const pendingFollowups = db
    .prepare(
      "SELECT COUNT(*) as count FROM pending_followups WHERE completed = 0",
    )
    .get() as { count: number };

  res.json({
    totalChats: totalChats.count,
    totalMessages: totalMessages.count,
    totalSummaries: totalSummaries.count,
    pendingFollowups: pendingFollowups.count,
  });
});

export default router;
