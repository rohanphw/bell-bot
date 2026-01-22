import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { getOrCreateProfile, updateProfileFacts } from "../db";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function extractAndUpdateProfile(
  chatId: number,
  recentConversation: string,
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

IMPORTANT: All values must be strings, not arrays. If there are multiple items, combine them into a single comma-separated string.

Example of correct format:
{
  "name": "John",
  "interests": "gaming, music, hiking",
  "ongoing_situations": "job search, dealing with anxiety"
}

Example of INCORRECT format (do not do this):
{
  "interests": ["gaming", "music", "hiking"]
}

Only include facts explicitly stated or strongly implied. Don't guess.`,
    messages: [
      {
        role: "user",
        content: `Current profile:\n${JSON.stringify(currentProfile.facts, null, 2)}\n\nRecent conversation:\n${recentConversation}\n\nReturn updated profile as JSON, merging new facts with existing ones. Only JSON, no explanation. Remember: all values must be strings, not arrays.`,
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

    const parsed = JSON.parse(cleanedText);

    // Ensure all values are strings (flatten arrays if LLM didn't follow instructions)
    const newFacts: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        newFacts[key] = value.join(", ");
      } else if (typeof value === "string") {
        newFacts[key] = value;
      } else if (value !== null && value !== undefined) {
        newFacts[key] = String(value);
      }
    }

    await updateProfileFacts(chatId, newFacts);
    return newFacts;
  } catch (error) {
    console.error("Failed to parse profile JSON:", error);
    return currentProfile.facts;
  }
}
