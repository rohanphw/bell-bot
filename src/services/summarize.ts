import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { db } from "../db";
import { saveSummary } from "../db";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

interface RawMessage {
  role: string;
  content: string;
  created_at: string;
}

export async function summarizeDaily(chatId: number): Promise<string | null> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get messages from the last 24 hours
  const messages = db
    .prepare(
      `SELECT role, content, created_at 
       FROM messages 
       WHERE chat_id = ? AND created_at >= ? 
       ORDER BY created_at ASC`,
    )
    .all(chatId, yesterday.toISOString()) as RawMessage[];

  if (messages.length < 4) {
    // Not enough conversation to summarize
    return null;
  }

  const conversation = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `You are a summarization assistant. Your job is to create concise summaries of conversations between a user and Bell (a mental health companion bot).

Focus on:
- Key topics discussed
- Emotional state of the user
- Any concerns or issues raised
- Any plans, events, or commitments mentioned
- Progress or changes from previous conversations

Keep summaries factual and concise. Use bullet points. Do not include fluff.`,
    messages: [
      {
        role: "user",
        content: `Summarize this conversation:\n\n${conversation}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const summary = textBlock?.text ?? null;

  if (summary) {
    saveSummary(chatId, "daily", summary, yesterday, now);
  }

  return summary;
}

export async function summarizeWeekly(chatId: number): Promise<string | null> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get daily summaries from the past week
  const summaries = db
    .prepare(
      `SELECT content, period_start, period_end 
       FROM summaries 
       WHERE chat_id = ? AND type = 'daily' AND created_at >= ? 
       ORDER BY period_start ASC`,
    )
    .all(chatId, weekAgo.toISOString()) as {
    content: string;
    period_start: string;
    period_end: string;
  }[];

  if (summaries.length < 3) {
    // Not enough daily summaries for a weekly rollup
    return null;
  }

  const summaryText = summaries
    .map((s) => `[${s.period_start.split("T")[0]}]\n${s.content}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `You are a summarization assistant. Your job is to create weekly rollup summaries from daily conversation summaries.

Focus on:
- Overall themes and patterns for the week
- Emotional trajectory (improving, declining, stable)
- Recurring concerns or topics
- Notable events or milestones
- Any action items or commitments made

Keep it concise and insightful.`,
    messages: [
      {
        role: "user",
        content: `Create a weekly summary from these daily summaries:\n\n${summaryText}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const summary = textBlock?.text ?? null;

  if (summary) {
    saveSummary(chatId, "weekly", summary, weekAgo, now);
  }

  return summary;
}

export function getAllChatIds(): number[] {
  const rows = db.prepare("SELECT DISTINCT chat_id FROM messages").all() as {
    chat_id: number;
  }[];

  return rows.map((r) => r.chat_id);
}
