import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { Message, Summary } from "../db";
import { saveSummary } from "../db";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function summarizeDaily(chatId: number): Promise<string | null> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get messages from the last 24 hours
  const messages = await Message.find({
    chatId,
    createdAt: { $gte: yesterday },
  })
    .sort({ createdAt: 1 })
    .lean();

  if (messages.length < 4) {
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
    await saveSummary(chatId, "daily", summary, yesterday, now);
  }

  return summary;
}

export async function summarizeWeekly(chatId: number): Promise<string | null> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get daily summaries from the past week
  const summaries = await Summary.find({
    chatId,
    type: "daily",
    createdAt: { $gte: weekAgo },
  })
    .sort({ periodStart: 1 })
    .lean();

  if (summaries.length < 3) {
    return null;
  }

  const summaryText = summaries
    .map((s) => `[${s.periodStart.toISOString().split("T")[0]}]\n${s.content}`)
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
    await saveSummary(chatId, "weekly", summary, weekAgo, now);
  }

  return summary;
}

export async function getAllChatIds(): Promise<number[]> {
  const chats = await Message.distinct("chatId");
  return chats;
}
