import "dotenv/config";

export const env = {
  BOT_TOKEN: process.env.BOT_TOKEN!,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
  DATA_DIR: process.env.DATA_DIR || "./data",
} as const;

const requiredVars = ["BOT_TOKEN", "ANTHROPIC_API_KEY"] as const;

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
