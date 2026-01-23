import { Message, Summary, UserProfile, PendingFollowup } from "./schema";
import type {
  Message as MessageType,
  Summary as SummaryType,
  UserProfile as UserProfileType,
  PendingFollowup as PendingFollowupType,
} from "../types";

// Messages
export async function saveMessage(
  chatId: number,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  await Message.create({ chatId, role, content });
}

export async function getRecentMessages(
  chatId: number,
  limit = 20,
): Promise<MessageType[]> {
  const messages = await Message.find({ chatId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse().map((m) => ({
    id: m._id.toString(),
    chatId: m.chatId,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.createdAt,
  }));
}

// Summaries
export async function saveSummary(
  chatId: number,
  type: "daily" | "weekly",
  content: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<void> {
  await Summary.create({ chatId, type, content, periodStart, periodEnd });
}

export async function getSummaries(
  chatId: number,
  limit = 5,
): Promise<SummaryType[]> {
  const summaries = await Summary.find({ chatId })
    .sort({ periodEnd: -1 })
    .limit(limit)
    .lean();

  return summaries.map((s) => ({
    id: s._id.toString(),
    chatId: s.chatId,
    type: s.type as "daily" | "weekly",
    content: s.content,
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    createdAt: s.createdAt,
  }));
}

// User Profile
export async function getOrCreateProfile(
  chatId: number,
): Promise<UserProfileType> {
  let profile = await UserProfile.findOne({ chatId }).lean();

  if (!profile) {
    await UserProfile.create({ chatId, facts: {} });
    return { chatId, facts: {}, updatedAt: new Date() };
  }

  const facts: Record<string, string> = {};
  if (profile.facts instanceof Map) {
    profile.facts.forEach((value: string, key: string) => {
      facts[key] = value;
    });
  } else if (profile.facts && typeof profile.facts === "object") {
    Object.entries(profile.facts).forEach(([key, value]) => {
      facts[key] = value;
    });
  }

  return {
    chatId: profile.chatId,
    facts,
    updatedAt: profile.updatedAt,
  };
}

export async function updateProfileFacts(
  chatId: number,
  facts: Record<string, string>,
): Promise<void> {
  await UserProfile.findOneAndUpdate(
    { chatId },
    { facts, updatedAt: new Date() },
    { upsert: true },
  );
}

// Pending Followups
export async function addFollowup(
  chatId: number,
  topic: string,
  triggerAt: Date,
): Promise<void> {
  await PendingFollowup.create({ chatId, topic, triggerAt });
}

export async function getDueFollowups(): Promise<PendingFollowupType[]> {
  const followups = await PendingFollowup.find({
    completed: false,
    status: "pending",
    triggerAt: { $lte: new Date() },
  })
    .sort({ triggerAt: 1 })
    .lean();

  return followups.map((f) => mapFollowup(f));
}

export async function getPendingFollowups(
  chatId: number,
): Promise<PendingFollowupType[]> {
  const followups = await PendingFollowup.find({ chatId, completed: false })
    .sort({ triggerAt: 1 })
    .lean();

  return followups.map((f) => mapFollowup(f));
}

export async function getAllFollowups(
  chatId: number,
): Promise<PendingFollowupType[]> {
  const followups = await PendingFollowup.find({ chatId })
    .sort({ createdAt: -1 })
    .lean();

  return followups.map((f) => mapFollowup(f));
}

export async function getSentFollowups(
  chatId: number,
): Promise<PendingFollowupType[]> {
  const followups = await PendingFollowup.find({
    chatId,
    status: "sent",
  })
    .sort({ sentAt: -1 })
    .lean();

  return followups.map((f) => mapFollowup(f));
}

export async function markFollowupComplete(id: string): Promise<void> {
  await PendingFollowup.findByIdAndUpdate(id, { completed: true });
}

export async function updateFollowupSent(
  id: string,
  checkinMessage: string,
): Promise<void> {
  await PendingFollowup.findByIdAndUpdate(id, {
    status: "sent",
    sentAt: new Date(),
    checkinMessage,
  });
}

export async function updateFollowupResponse(
  id: string,
  userResponse: string,
): Promise<void> {
  await PendingFollowup.findByIdAndUpdate(id, {
    status: "responded",
    respondedAt: new Date(),
    userResponse,
    completed: true,
  });
}

export async function expireOldFollowups(): Promise<number> {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const result = await PendingFollowup.updateMany(
    {
      status: "sent",
      sentAt: { $lte: twoDaysAgo },
    },
    {
      status: "no_response",
      completed: true,
    },
  );

  return result.modifiedCount;
}

// Clear data
export async function clearChatData(chatId: number): Promise<void> {
  await Promise.all([
    Message.deleteMany({ chatId }),
    Summary.deleteMany({ chatId }),
    UserProfile.deleteOne({ chatId }),
    PendingFollowup.deleteMany({ chatId }),
  ]);
}

// Helper function to map followup documents
function mapFollowup(f: any): PendingFollowupType {
  return {
    id: f._id.toString(),
    chatId: f.chatId,
    topic: f.topic,
    triggerAt: f.triggerAt,
    completed: f.completed,
    createdAt: f.createdAt,
    status: f.status || "pending",
    sentAt: f.sentAt,
    respondedAt: f.respondedAt,
    checkinMessage: f.checkinMessage,
    userResponse: f.userResponse,
  };
}
