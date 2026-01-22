import { Router } from "express";
import { db } from "../../db";
import { dashboardView } from "../views/dashboard";
import { chatsListView } from "../views/chats";
import { chatDetailView } from "../views/chatDetail";

const router = Router();

// Dashboard
router.get("/", (req, res) => {
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

  const html = dashboardView({
    totalChats: totalChats.count,
    totalMessages: totalMessages.count,
    totalSummaries: totalSummaries.count,
    pendingFollowups: pendingFollowups.count,
  });

  res.send(html);
});

// Chats list
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
    .all() as { chatId: number; messageCount: number; lastMessage: string }[];

  const html = chatsListView(chats);
  res.send(html);
});

// Chat detail
router.get("/chats/:id", (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const messages = db
    .prepare(
      `
    SELECT id, role, content, created_at as createdAt
    FROM messages
    WHERE chat_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `,
    )
    .all(chatId) as {
    id: number;
    role: string;
    content: string;
    createdAt: string;
  }[];

  const summaries = db
    .prepare(
      `
    SELECT id, type, content, period_start as periodStart, period_end as periodEnd
    FROM summaries
    WHERE chat_id = ?
    ORDER BY created_at DESC
  `,
    )
    .all(chatId) as {
    id: number;
    type: string;
    content: string;
    periodStart: string;
    periodEnd: string;
  }[];

  const followups = db
    .prepare(
      `
    SELECT id, topic, trigger_at as triggerAt, completed
    FROM pending_followups
    WHERE chat_id = ?
    ORDER BY trigger_at DESC
  `,
    )
    .all(chatId) as {
    id: number;
    topic: string;
    triggerAt: string;
    completed: number;
  }[];

  const profileRow = db
    .prepare("SELECT facts FROM user_profiles WHERE chat_id = ?")
    .get(chatId) as { facts: string } | undefined;

  const profile = profileRow ? JSON.parse(profileRow.facts) : {};

  const html = chatDetailView({
    chatId,
    messages: messages.reverse(),
    summaries,
    followups,
    profile,
  });

  res.send(html);
});

export default router;
