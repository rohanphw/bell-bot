import { createBot } from "./bot";
import { initializeDb } from "./db";
import { startScheduler } from "./services";
import { startWebServer } from "./web";

async function main() {
  await initializeDb();
  console.log("Database initialized");

  const bot = createBot();

  startScheduler(bot);
  startWebServer();

  bot.start();
  console.log("Bot is running...");
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
