import { Context } from "grammy";
import {
  saveMessage,
  getRecentMessages,
  getSummaries,
  getOrCreateProfile,
  getSentFollowups,
  updateFollowupResponse,
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

  try {
    // Save user message
    await saveMessage(chatId, "user", text);
    console.log(`Saved user message from chat ${chatId}`);

    // Check if this is a response to a sent followup
    await checkAndUpdateFollowupResponse(chatId, text);

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

async function checkAndUpdateFollowupResponse(
  chatId: number,
  userMessage: string,
): Promise<void> {
  try {
    const sentFollowups = await getSentFollowups(chatId);

    if (sentFollowups.length === 0) return;

    // Mark the most recent sent followup as responded
    // In a more sophisticated system, you could use AI to match the response to specific followups
    const mostRecentFollowup = sentFollowups[0];
    await updateFollowupResponse(mostRecentFollowup.id, userMessage);
    console.log(`Followup "${mostRecentFollowup.topic}" marked as responded`);
  } catch (error) {
    console.error("Error updating followup response:", error);
  }
}
