import "dotenv/config";

export const env = {
  BOT_TOKEN: process.env.BOT_TOKEN!,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
  MONGO_URI: process.env.MONGO_URI!,
  TIMEZONE: process.env.TIMEZONE || "UTC",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "changeme",
  PORT: parseInt(process.env.PORT || "3000", 10),
} as const;

const requiredVars = ["BOT_TOKEN", "ANTHROPIC_API_KEY", "MONGO_URI"] as const;

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
