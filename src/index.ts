import { createBot } from "./bot";
import { initializeDb } from "./db";
import { startScheduler } from "./services";
import { startWebServer } from "./web";

initializeDb();
console.log("Database initialized");

const bot = createBot();

startScheduler(bot);
startWebServer();

bot.start();
console.log("Bot is running...");
