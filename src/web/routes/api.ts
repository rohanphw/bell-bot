import { Router } from "express";
import { Message, Summary, UserProfile, PendingFollowup } from "../../db";

const router = Router();

// Get all chats
router.get("/chats", async (req, res) => {
  const chats = await Message.aggregate([
    {
      $group: {
        _id: "$chatId",
        messageCount: { $sum: 1 },
        lastMessage: { $max: "$createdAt" },
      },
    },
    { $sort: { lastMessage: -1 } },
  ]);

  res.json(
    chats.map((c) => ({
      chatId: c._id,
      messageCount: c.messageCount,
      lastMessage: c.lastMessage,
    })),
  );
});

// Get chat detail
router.get("/chats/:id", async (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const messageCount = await Message.countDocuments({ chatId });
  const summaryCount = await Summary.countDocuments({ chatId });
  const followupCount = await PendingFollowup.countDocuments({
    chatId,
    completed: false,
  });
  const profile = await UserProfile.findOne({ chatId }).lean();

  const facts: Record<string, string> = {};
  if (profile?.facts) {
    if (profile.facts instanceof Map) {
      profile.facts.forEach((value: string, key: string) => {
        facts[key] = value;
      });
    } else {
      Object.assign(facts, profile.facts);
    }
  }

  res.json({
    chatId,
    messageCount,
    summaryCount,
    pendingFollowups: followupCount,
    profile: facts,
  });
});

// Get messages for a chat
router.get("/chats/:id/messages", async (req, res) => {
  const chatId = parseInt(req.params.id, 10);
  const limit = parseInt(req.query.limit as string, 10) || 50;

  const messages = await Message.find({ chatId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json(
    messages.reverse().map((m) => ({
      id: m._id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  );
});

// Get summaries for a chat
router.get("/chats/:id/summaries", async (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const summaries = await Summary.find({ chatId })
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    summaries.map((s) => ({
      id: s._id,
      type: s.type,
      content: s.content,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      createdAt: s.createdAt,
    })),
  );
});

// Get profile for a chat
router.get("/chats/:id/profile", async (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const profile = await UserProfile.findOne({ chatId }).lean();

  if (!profile) {
    res.json({ facts: {}, updatedAt: null });
    return;
  }

  const facts: Record<string, string> = {};
  if (profile.facts instanceof Map) {
    profile.facts.forEach((value: string, key: string) => {
      facts[key] = value;
    });
  } else if (profile.facts) {
    Object.assign(facts, profile.facts);
  }

  res.json({
    facts,
    updatedAt: profile.updatedAt,
  });
});

// Get followups for a chat
router.get("/chats/:id/followups", async (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const followups = await PendingFollowup.find({ chatId })
    .sort({ triggerAt: -1 })
    .lean();

  res.json(
    followups.map((f) => ({
      id: f._id,
      topic: f.topic,
      triggerAt: f.triggerAt,
      completed: f.completed,
      createdAt: f.createdAt,
    })),
  );
});

// Get overall stats
router.get("/stats", async (req, res) => {
  const totalChats = await Message.distinct("chatId").then((ids) => ids.length);
  const totalMessages = await Message.countDocuments();
  const totalSummaries = await Summary.countDocuments();
  const pendingFollowups = await PendingFollowup.countDocuments({
    completed: false,
  });

  res.json({
    totalChats,
    totalMessages,
    totalSummaries,
    pendingFollowups,
  });
});

export default router;
