export interface Message {
  id: string;
  chatId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Summary {
  id: string;
  chatId: number;
  type: "daily" | "weekly";
  content: string;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

export interface UserProfile {
  chatId: number;
  facts: Record<string, string>;
  updatedAt: Date;
}

export interface PendingFollowup {
  id: string;
  chatId: number;
  topic: string;
  triggerAt: Date;
  completed: boolean;
  createdAt: Date;
}
