import { Context } from "grammy";
import {
  saveMessage,
  getRecentMessages,
  getSummaries,
  getOrCreateProfile,
} from "../../db";
import {
  generateResponse,
  extractAndUpdateProfile,
  extractFollowups,
} from "../../services";

// Track message count per chat for periodic extractions
const messageCount: Record<number, number> = {};

export async function handleMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  const chatId = ctx.chat?.id;

  if (!text || !chatId) return;

  // Save user message
  await saveMessage(chatId, "user", text);

  try {
    // Build context
    const recentMessages = await getRecentMessages(chatId, 20);
    const summaries = await getSummaries(chatId, 5);
    const profile = await getOrCreateProfile(chatId);

    // Generate response
    const response = await generateResponse(text, {
      recentMessages,
      summaries,
      profile,
    });

    // Save bot response
    await saveMessage(chatId, "assistant", response);

    await ctx.reply(response);

    // Periodic extractions every 10 messages
    messageCount[chatId] = (messageCount[chatId] || 0) + 1;
    if (messageCount[chatId] >= 10) {
      messageCount[chatId] = 0;

      const conversation = recentMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      // Run extractions in background
      Promise.all([
        extractAndUpdateProfile(chatId, conversation),
        extractFollowups(chatId, conversation),
      ])
        .then(() => {
          console.log(`Profile and followups updated for chat ${chatId}`);
        })
        .catch((err) => {
          console.error("Background extraction error:", err);
        });
    }
  } catch (error) {
    console.error("Error generating response:", error);
    await ctx.reply(
      "Sorry, I'm having trouble responding right now. Please try again in a moment.",
    );
  }
}
