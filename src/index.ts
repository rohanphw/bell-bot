import { createBot } from "./bot";
import { initializeDb } from "./db";
import { startScheduler, logger } from "./services";
import { startWebServer } from "./web";

async function main() {
  logger.info("startup", "Starting Bell Bot...");

  await initializeDb();
  logger.info("startup", "Database connected");

  const bot = createBot();
  logger.info("startup", "Bot created");

  startScheduler(bot);
  startWebServer();

  bot.start();
  logger.info("startup", "Bot is running");
}

main().catch((err) => {
  logger.error("startup", "Failed to start", err.message);
  console.error("Failed to start:", err);
  process.exit(1);
});
