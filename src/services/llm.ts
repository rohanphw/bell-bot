import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { SYSTEM_PROMPT } from "../config/prompts";
import type { Message, Summary, UserProfile } from "../types";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

interface ChatContext {
  recentMessages: Message[];
  summaries: Summary[];
  profile: UserProfile;
}

export async function generateResponse(
  userMessage: string,
  context: ChatContext,
): Promise<string> {
  const contextBlock = buildContextBlock(context);

  const messages: Anthropic.MessageParam[] = [
    ...context.recentMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  const systemPrompt = contextBlock
    ? `${SYSTEM_PROMPT}\n\n${contextBlock}`
    : SYSTEM_PROMPT;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "Sorry, I couldn't generate a response.";
}

function buildContextBlock(context: ChatContext): string {
  const parts: string[] = [];

  if (Object.keys(context.profile.facts).length > 0) {
    const facts = Object.entries(context.profile.facts)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");
    parts.push(`<user_facts>\n${facts}\n</user_facts>`);
  }

  if (context.summaries.length > 0) {
    const summaryText = context.summaries
      .map((s) => `[${s.type}] ${s.content}`)
      .join("\n\n");
    parts.push(`<past_summaries>\n${summaryText}\n</past_summaries>`);
  }

  return parts.join("\n\n");
}
