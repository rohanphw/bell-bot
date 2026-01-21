import { Context } from "grammy";

export async function handleHelp(ctx: Context): Promise<void> {
  const helpText = `🤖 *Bell Commands*

*Chat*
/start - Start fresh conversation
/help - Show this help message

*Memory & Profile*
/profile - View what I know about you
/extractprofile - Update profile from recent chat
/followups - View pending followups
/extractfollowups - Extract followups from chat

*Summaries*
/summarize - Create daily summary
/weeklysummary - Create weekly rollup

*Check-ins*
/checkin - Preview next check-in message

*Data*
/reset - Clear all your data

Just chat normally and I'll remember our conversations! 💙`;

  await ctx.reply(helpText, { parse_mode: "Markdown" });
}
