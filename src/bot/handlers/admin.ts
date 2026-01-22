import { Context } from "grammy";
import {
  summarizeDaily,
  summarizeWeekly,
  extractAndUpdateProfile,
  generateCheckin,
  extractFollowups,
} from "../../services";
import {
  getOrCreateProfile,
  getRecentMessages,
  getPendingFollowups,
} from "../../db";

export async function handleSummarize(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  await ctx.reply("Running summarization...");

  try {
    const dailySummary = await summarizeDaily(chatId);

    if (dailySummary) {
      await ctx.reply(`📝 Daily summary created:\n\n${dailySummary}`);
    } else {
      await ctx.reply("Not enough messages in the last 24 hours to summarize.");
    }
  } catch (error) {
    console.error("Summarization error:", error);
    await ctx.reply("Failed to create summary. Check logs for details.");
  }
}

export async function handleWeeklySummary(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  await ctx.reply("Running weekly summarization...");

  try {
    const weeklySummary = await summarizeWeekly(chatId);

    if (weeklySummary) {
      await ctx.reply(`📊 Weekly summary created:\n\n${weeklySummary}`);
    } else {
      await ctx.reply("Not enough daily summaries to create a weekly rollup.");
    }
  } catch (error) {
    console.error("Weekly summarization error:", error);
    await ctx.reply("Failed to create weekly summary. Check logs for details.");
  }
}

export async function handleProfile(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const profile = await getOrCreateProfile(chatId);
  const facts = Object.entries(profile.facts);

  if (facts.length === 0) {
    await ctx.reply(
      "No profile data yet. Keep chatting and I'll learn more about you!",
    );
    return;
  }

  const formatted = facts
    .map(([key, value]) => `• ${key}: ${value}`)
    .join("\n");

  await ctx.reply(`🧠 What I know about you:\n\n${formatted}`);
}

export async function handleExtractProfile(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  await ctx.reply("Extracting profile from recent messages...");

  try {
    const recentMessages = await getRecentMessages(chatId, 20);

    if (recentMessages.length < 4) {
      await ctx.reply("Not enough messages to extract a profile yet.");
      return;
    }

    const conversation = recentMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const newFacts = await extractAndUpdateProfile(chatId, conversation);

    const formatted = Object.entries(newFacts)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join("\n");

    await ctx.reply(`🧠 Profile updated:\n\n${formatted}`);
  } catch (error) {
    console.error("Profile extraction error:", error);
    await ctx.reply("Failed to extract profile. Check logs for details.");
  }
}

export async function handleCheckin(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  await ctx.reply("Generating check-in decision...");

  try {
    const decision = await generateCheckin(chatId);

    if (decision.shouldCheckin && decision.message) {
      await ctx.reply(`✅ Would send check-in:\n\n"${decision.message}"`);
    } else {
      await ctx.reply(
        "❌ No check-in needed right now (talked too recently or nothing to follow up on).",
      );
    }
  } catch (error) {
    console.error("Check-in error:", error);
    await ctx.reply("Failed to generate check-in. Check logs for details.");
  }
}

export async function handleFollowups(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const followups = await getPendingFollowups(chatId);

  if (followups.length === 0) {
    await ctx.reply("📋 No pending followups.");
    return;
  }

  const formatted = followups
    .map((f) => {
      const date = new Date(f.triggerAt).toLocaleString();
      return `• ${f.topic}\n  📅 ${date}`;
    })
    .join("\n\n");

  await ctx.reply(`📋 Pending followups:\n\n${formatted}`);
}

export async function handleExtractFollowups(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  await ctx.reply("Extracting followups from recent messages...");

  try {
    const recentMessages = await getRecentMessages(chatId, 20);

    if (recentMessages.length < 2) {
      await ctx.reply("Not enough messages to extract followups.");
      return;
    }

    const conversation = recentMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const followups = await extractFollowups(chatId, conversation);

    if (followups.length === 0) {
      await ctx.reply("No followups found in recent conversation.");
      return;
    }

    const formatted = followups
      .map((f) => `• ${f.topic}\n  📅 ${f.triggerAt}`)
      .join("\n\n");

    await ctx.reply(`📋 Followups extracted:\n\n${formatted}`);
  } catch (error) {
    console.error("Followup extraction error:", error);
    await ctx.reply("Failed to extract followups. Check logs for details.");
  }
}
