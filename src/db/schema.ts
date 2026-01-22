import mongoose from "mongoose";
import { env } from "../config/env";

export async function initializeDb(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected to MongoDB");
}

// Message Schema
const messageSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, index: true },
  role: { type: String, required: true, enum: ["user", "assistant"] },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Summary Schema
const summarySchema = new mongoose.Schema({
  chatId: { type: Number, required: true, index: true },
  type: { type: String, required: true, enum: ["daily", "weekly"] },
  content: { type: String, required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, unique: true },
  facts: { type: Map, of: String, default: {} },
  updatedAt: { type: Date, default: Date.now },
});

// Pending Followup Schema
const pendingFollowupSchema = new mongoose.Schema({
  chatId: { type: Number, required: true, index: true },
  topic: { type: String, required: true },
  triggerAt: { type: Date, required: true, index: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Message = mongoose.model("Message", messageSchema);
export const Summary = mongoose.model("Summary", summarySchema);
export const UserProfile = mongoose.model("UserProfile", userProfileSchema);
export const PendingFollowup = mongoose.model(
  "PendingFollowup",
  pendingFollowupSchema,
);
