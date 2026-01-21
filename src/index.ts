import { createBot } from "./bot";
import { initializeDb } from "./db";
import { startScheduler } from "./services";

initializeDb();
console.log("Database initialized");

const bot = createBot();

startScheduler(bot);

bot.start();
console.log("Bot is running...");
