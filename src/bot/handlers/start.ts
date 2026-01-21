import { Context } from "grammy";

export async function handleStart(ctx: Context): Promise<void> {
  await ctx.reply("Hey! I'm your companion bot. How are you doing today?");
}
