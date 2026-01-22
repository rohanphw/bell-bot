import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { getOrCreateProfile, updateProfileFacts } from "../db";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function extractAndUpdateProfile(
  chatId: number,
  recentConversation: string
): Promise<Record<string, string>> {
  const currentProfile = await getOrCreateProfile(chatId);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `You extract key facts about a user from conversations. Return ONLY valid JSON, no other text.

Extract facts like:
- name
- age
- location
- occupation
- relationships (partner, family, friends mentioned by name)
- ongoing_situations (job search, health issues, etc.)
- interests
- preferences
- mental_health_notes (patterns you notice, but be gentle)

Only include facts explicitly stated or strongly implied. Don't guess.`,
    messages: [
      {
        role: "user",
        content: `Current profile:\n${JSON.stringify(currentProfile.facts, null, 2)}\n\nRecent conversation:\n${recentConversation}\n\nReturn updated profile as JSON, merging new facts with existing ones. Only JSON, no explanation.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) return currentProfile.facts;

  try {
    const cleanedText = textBlock.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const newFacts = JSON.parse(cleanedText);
    await updateProfileFacts(chatId, newFacts);
    return newFacts;
  } catch (error) {
    console.error("Failed to parse profile JSON:", error);
    return currentProfile.facts;
  }
}