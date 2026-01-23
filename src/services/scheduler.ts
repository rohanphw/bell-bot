import cron from "node-cron";
import { Bot } from "grammy";
import { env } from "../config/env";
import { summarizeDaily, summarizeWeekly, getAllChatIds } from "./summarize";
import { sendCheckin } from "./checkin";
import { expireOldFollowups } from "../db";
import { logger } from "./logger";

let botInstance: Bot | null = null;

export function startScheduler(bot: Bot): void {
  botInstance = bot;

  const cronOptions = { timezone: env.TIMEZONE };

  // Run daily summaries every night at midnight
  cron.schedule("0 0 * * *", async () => {
    logger.info("scheduler", "Running daily summarization...");

    const chatIds = await getAllChatIds();

    for (const chatId of chatIds) {
      try {
        const summary = await summarizeDaily(chatId);
        if (summary) {
          logger.info("scheduler", `Daily summary created for chat ${chatId}`);
        }
      } catch (error: any) {
        logger.error("scheduler", `Failed to summarize chat ${chatId}`, error.message);
      }
    }

    // Also expire old followups
    try {
      const expired = await expireOldFollowups();
      if (expired > 0) {
        logger.info("scheduler", `Expired ${expired} old followups`);
      }
    } catch (error: any) {
      logger.error("scheduler", "Failed to expire followups", error.message);
    }
  }, cronOptions);

  // Run weekly summaries every Sunday at 1am
  cron.schedule("0 1 * * 0", async () => {
    logger.info("scheduler", "Running weekly summarization...");

    const chatIds = await getAllChatIds();

    for (const chatId of chatIds) {
      try {
        const summary = await summarizeWeekly(chatId);
        if (summary) {
          logger.info("scheduler", `Weekly summary created for chat ${chatId}`);
        }
      } catch (error: any) {
        logger.error("scheduler", `Failed weekly summary for chat ${chatId}`, error.message);
      }
    }
  }, cronOptions);

  // Check-ins run three times daily: 9am, 2pm, 7pm
  cron.schedule("0 9,14,19 * * *", async () => {
    if (!botInstance) return;

    logger.info("scheduler", "Running check-ins...");

    const chatIds = await getAllChatIds();

    for (const chatId of chatIds) {
      try {
        const sent = await sendCheckin(botInstance, chatId);
        if (sent) {
          logger.info("scheduler", `Check-in sent to chat ${chatId}`);
        } else {
          logger.debug("scheduler", `Check-in skipped for chat ${chatId}`);
        }
      } catch (error: any) {
        logger.error("scheduler", `Failed check-in for chat ${chatId}`, error.message);
      }
    }
  }, cronOptions);

  logger.info("scheduler", `Scheduler started (timezone: ${env.TIMEZONE})`);
  logger.info("scheduler", "Daily summaries at midnight");
  logger.info("scheduler", "Weekly summaries on Sundays at 1am");
  logger.info("scheduler", "Check-ins at 9am, 2pm, 7pm");
}

export function getBot(): Bot | null {
  return botInstance;
}