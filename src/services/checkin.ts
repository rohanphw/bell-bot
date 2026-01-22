import Anthropic from "@anthropic-ai/sdk";
import { Bot } from "grammy";
import { env } from "../config/env";
import { Message } from "../db";
import {
  getSummaries,
  getOrCreateProfile,
  getDueFollowups,
  markFollowupComplete,
  saveMessage,
} from "../db";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

interface CheckinDecision {
  shouldCheckin: boolean;
  message: string | null;
}

export async function generateCheckin(
  chatId: number,
): Promise<CheckinDecision> {
  const profile = await getOrCreateProfile(chatId);
  const summaries = await getSummaries(chatId, 3);
  const allDueFollowups = await getDueFollowups();
  const dueFollowups = allDueFollowups.filter((f) => f.chatId === chatId);

  // Get last message time to avoid checking in too frequently
  const lastMessage = await Message.findOne({ chatId })
    .sort({ createdAt: -1 })
    .lean();

  if (lastMessage) {
    const hoursSinceLastMessage =
      (Date.now() - new Date(lastMessage.createdAt).getTime()) /
      (1000 * 60 * 60);

    // Don't check in if we talked within the last 4 hours
    if (hoursSinceLastMessage < 4) {
      return { shouldCheckin: false, message: null };
    }
  }

  const context = {
    profile: profile.facts,
    recentSummaries: summaries.map((s) => s.content),
    pendingFollowups: dueFollowups.map((f) => f.topic),
  };

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: `You are Bell, a caring companion bot. Based on the user context, decide if you should send a check-in message.

Consider:
- Pending followups that are due
- Recent emotional state from summaries
- Time-sensitive things mentioned (interviews, appointments, etc.)
- General wellbeing check if it's been a while

Respond with JSON only:
{
  "shouldCheckin": true/false,
  "message": "your caring check-in message" or null
}

Keep messages warm, brief, and natural - like a friend texting. Don't be robotic or formal.`,
    messages: [
      {
        role: "user",
        content: `User context:\n${JSON.stringify(context, null, 2)}\n\nShould we check in? Respond with JSON only.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) return { shouldCheckin: false, message: null };

  try {
    const cleanedText = textBlock.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanedText);
  } catch {
    return { shouldCheckin: false, message: null };
  }
}

export async function sendCheckin(bot: Bot, chatId: number): Promise<boolean> {
  try {
    const decision = await generateCheckin(chatId);

    if (decision.shouldCheckin && decision.message) {
      await bot.api.sendMessage(chatId, decision.message);
      await saveMessage(chatId, "assistant", decision.message);

      // Mark any due followups as complete
      const allDueFollowups = await getDueFollowups();
      const dueFollowups = allDueFollowups.filter((f) => f.chatId === chatId);
      for (const followup of dueFollowups) {
        await markFollowupComplete(followup.id);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error(`Failed to send check-in to ${chatId}:`, error);
    return false;
  }
}
