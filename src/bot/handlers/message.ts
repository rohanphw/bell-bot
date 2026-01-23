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
  logger,
} from "../../services";

// Track message count per chat for periodic extractions
const messageCount: Record<number, number> = {};

export async function handleMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  const chatId = ctx.chat?.id;
  const username = ctx.from?.username || ctx.from?.first_name || "unknown";

  if (!text || !chatId) return;

  try {
    logger.info(
      "message",
      `Received from @${username} (${chatId}): "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
    );

    // Save user message
    await saveMessage(chatId, "user", text);

    // Check if this is a response to a sent followup
    await checkAndUpdateFollowupResponse(chatId, text);

    // Build context
    const recentMessages = await getRecentMessages(chatId, 20);
    const summaries = await getSummaries(chatId, 5);
    const profile = await getOrCreateProfile(chatId);

    logger.debug("context", `Built context for ${chatId}`, {
      messages: recentMessages.length,
      summaries: summaries.length,
      profileFacts: Object.keys(profile.facts).length,
    });

    // Generate response
    const response = await generateResponse(text, {
      recentMessages,
      summaries,
      profile,
    });

    logger.info(
      "response",
      `Sent to @${username} (${chatId}): "${response.substring(0, 50)}${response.length > 50 ? "..." : ""}"`,
    );

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

      logger.info(
        "extraction",
        `Running periodic extraction for chat ${chatId}`,
      );

      // Run extractions in background
      Promise.all([
        extractAndUpdateProfile(chatId, conversation),
        extractFollowups(chatId, conversation),
      ])
        .then(() => {
          logger.info("extraction", `Completed extraction for chat ${chatId}`);
        })
        .catch((err) => {
          logger.error(
            "extraction",
            `Failed extraction for chat ${chatId}`,
            err.message,
          );
        });
    }
  } catch (error: any) {
    logger.error(
      "message",
      `Error handling message from ${chatId}`,
      error.message,
    );
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

    const mostRecentFollowup = sentFollowups[0];
    await updateFollowupResponse(mostRecentFollowup.id, userMessage);
    logger.info(
      "followup",
      `Followup "${mostRecentFollowup.topic}" marked as responded for chat ${chatId}`,
    );
  } catch (error: any) {
    logger.error(
      "followup",
      `Error updating followup response for ${chatId}`,
      error.message,
    );
  }
}
