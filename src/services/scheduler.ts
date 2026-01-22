import cron from "node-cron";
import { Bot } from "grammy";
import { env } from "../config/env";
import { summarizeDaily, summarizeWeekly, getAllChatIds } from "./summarize";
import { sendCheckin } from "./checkin";

let botInstance: Bot | null = null;

export function startScheduler(bot: Bot): void {
  botInstance = bot;

  const cronOptions = { timezone: env.TIMEZONE };

  // Run daily summaries every night at midnight
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("Running daily summarization...");

      const chatIds = await getAllChatIds();

      for (const chatId of chatIds) {
        try {
          const summary = await summarizeDaily(chatId);
          if (summary) {
            console.log(`Daily summary created for chat ${chatId}`);
          }
        } catch (error) {
          console.error(`Failed to summarize chat ${chatId}:`, error);
        }
      }
    },
    cronOptions,
  );

  // Run weekly summaries every Sunday at 1am
  cron.schedule(
    "0 1 * * 0",
    async () => {
      console.log("Running weekly summarization...");

      const chatIds = await getAllChatIds();

      for (const chatId of chatIds) {
        try {
          const summary = await summarizeWeekly(chatId);
          if (summary) {
            console.log(`Weekly summary created for chat ${chatId}`);
          }
        } catch (error) {
          console.error(`Failed weekly summary for chat ${chatId}:`, error);
        }
      }
    },
    cronOptions,
  );

  // Check-ins run three times daily: 9am, 2pm, 7pm
  cron.schedule(
    "0 9,14,19 * * *",
    async () => {
      if (!botInstance) return;

      console.log("Running check-ins...");

      const chatIds = await getAllChatIds();

      for (const chatId of chatIds) {
        try {
          const sent = await sendCheckin(botInstance, chatId);
          if (sent) {
            console.log(`Check-in sent to chat ${chatId}`);
          }
        } catch (error) {
          console.error(`Failed check-in for chat ${chatId}:`, error);
        }
      }
    },
    cronOptions,
  );

  console.log(`Scheduler started (timezone: ${env.TIMEZONE}):`);
  console.log("  - Daily summaries at midnight");
  console.log("  - Weekly summaries on Sundays at 1am");
  console.log("  - Check-ins at 9am, 2pm, 7pm");
}

export function getBot(): Bot | null {
  return botInstance;
}
