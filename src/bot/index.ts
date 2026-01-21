import { Bot } from "grammy";
import { env } from "../config/env";
import { handleStart } from "./handlers/start";
import { handleMessage } from "./handlers/message";
import {
  handleSummarize,
  handleWeeklySummary,
  handleProfile,
  handleExtractProfile,
  handleCheckin,
  handleFollowups,
  handleExtractFollowups,
} from "./handlers/admin";
import {
  handleReset,
  handleConfirmReset,
  handleCancelReset,
} from "./handlers/reset";
import { handleHelp } from "./handlers/help";

export function createBot(): Bot {
  const bot = new Bot(env.BOT_TOKEN);

  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  bot.command("start", handleStart);
  bot.command("help", handleHelp);
  bot.command("summarize", handleSummarize);
  bot.command("weeklysummary", handleWeeklySummary);
  bot.command("profile", handleProfile);
  bot.command("extractprofile", handleExtractProfile);
  bot.command("checkin", handleCheckin);
  bot.command("followups", handleFollowups);
  bot.command("extractfollowups", handleExtractFollowups);
  bot.command("reset", handleReset);
  bot.command("confirmreset", handleConfirmReset);
  bot.command("cancelreset", handleCancelReset);
  bot.on("message:text", handleMessage);

  return bot;
}
