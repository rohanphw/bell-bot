import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { addFollowup } from "../db";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

interface ExtractedFollowup {
  topic: string;
  triggerAt: string;
}

export async function extractFollowups(
  chatId: number,
  conversation: string,
): Promise<ExtractedFollowup[]> {
  const today = new Date().toISOString().split("T")[0];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `You extract potential follow-up items from conversations. Look for:
- Upcoming events (interviews, appointments, meetings)
- Plans or commitments ("I'll try X tomorrow")
- Things the user is worried about that have a time component
- Health-related things to check on

Today's date is ${today}.

Respond with JSON array only:
[
  { "topic": "job interview at Google", "triggerAt": "2025-01-23T18:00:00Z" }
]

Rules:
- triggerAt should be when to check in AFTER the event (e.g., evening after an interview)
- If no specific date mentioned, don't include it
- Only include clear, actionable followups
- Return empty array [] if nothing found`,
    messages: [
      {
        role: "user",
        content: `Extract followups from this conversation:\n\n${conversation}\n\nJSON only:`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) return [];

  try {
    const cleanedText = textBlock.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const followups: ExtractedFollowup[] = JSON.parse(cleanedText);

    // Save to database
    for (const followup of followups) {
      await addFollowup(chatId, followup.topic, new Date(followup.triggerAt));
      console.log(`Followup added for chat ${chatId}: ${followup.topic}`);
    }

    return followups;
  } catch {
    return [];
  }
}
