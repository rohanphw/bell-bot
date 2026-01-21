import { Context } from "grammy";
import { clearChatData } from "../../db";

// Track pending confirmations
const pendingResets: Set<number> = new Set();

export async function handleReset(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  if (pendingResets.has(chatId)) {
    // Already waiting for confirmation
    await ctx.reply(
      "⚠️ Confirmation already pending. Send /confirmreset to proceed or /cancelreset to cancel.",
    );
    return;
  }

  pendingResets.add(chatId);

  // Auto-cancel after 60 seconds
  setTimeout(() => {
    pendingResets.delete(chatId);
  }, 60000);

  await ctx.reply(
    "⚠️ This will permanently delete:\n\n" +
      "• All message history\n" +
      "• All summaries\n" +
      "• Your profile data\n" +
      "• All pending followups\n\n" +
      "Send /confirmreset within 60 seconds to proceed, or /cancelreset to cancel.",
  );
}

export async function handleConfirmReset(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  if (!pendingResets.has(chatId)) {
    await ctx.reply("No reset pending. Use /reset first.");
    return;
  }

  pendingResets.delete(chatId);
  clearChatData(chatId);

  await ctx.reply(
    "🗑️ All data cleared. Let's start fresh!\n\nHi, I'm Bell. How are you doing today?",
  );
}

export async function handleCancelReset(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  if (!pendingResets.has(chatId)) {
    await ctx.reply("No reset pending.");
    return;
  }

  pendingResets.delete(chatId);
  await ctx.reply("✅ Reset cancelled. Your data is safe.");
}
