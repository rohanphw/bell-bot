import { Router } from "express";
import { Message, Summary, UserProfile, PendingFollowup } from "../../db";
import { dashboardView } from "../views/dashboard";
import { chatsListView } from "../views/chats";
import { chatDetailView } from "../views/chatDetail";

const router = Router();

// Dashboard
router.get("/", async (req, res) => {
  const totalChats = await Message.distinct("chatId").then((ids) => ids.length);
  const totalMessages = await Message.countDocuments();
  const totalSummaries = await Summary.countDocuments();
  const pendingFollowups = await PendingFollowup.countDocuments({ completed: false });

  const html = dashboardView({
    totalChats,
    totalMessages,
    totalSummaries,
    pendingFollowups,
  });

  res.send(html);
});

// Chats list
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

  const html = chatsListView(chats.map((c) => ({
    chatId: c._id,
    messageCount: c.messageCount,
    lastMessage: c.lastMessage,
  })));

  res.send(html);
});

// Chat detail
router.get("/chats/:id", async (req, res) => {
  const chatId = parseInt(req.params.id, 10);

  const messages = await Message.find({ chatId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const summaries = await Summary.find({ chatId })
    .sort({ createdAt: -1 })
    .lean();

  const followups = await PendingFollowup.find({ chatId })
    .sort({ triggerAt: -1 })
    .lean();

  const profileDoc = await UserProfile.findOne({ chatId }).lean();

  const profile: Record<string, string> = {};
  if (profileDoc?.facts) {
    if (profileDoc.facts instanceof Map) {
      profileDoc.facts.forEach((value: string, key: string) => {
        profile[key] = value;
      });
    } else {
      Object.assign(profile, profileDoc.facts);
    }
  }

  const html = chatDetailView({
    chatId,
    messages: messages.reverse().map((m) => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    summaries: summaries.map((s) => ({
      id: s._id.toString(),
      type: s.type,
      content: s.content,
      periodStart: s.periodStart.toISOString(),
      periodEnd: s.periodEnd.toISOString(),
    })),
    followups: followups.map((f) => ({
      id: f._id.toString(),
      topic: f.topic,
      triggerAt: f.triggerAt.toISOString(),
      completed: f.completed ? 1 : 0,
    })),
    profile,
  });

  res.send(html);
});

export default router;