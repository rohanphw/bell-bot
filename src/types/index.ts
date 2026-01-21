export interface Message {
  id: number;
  chatId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Summary {
  id: number;
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
  id: number;
  chatId: number;
  topic: string;
  triggerAt: Date;
  completed: boolean;
  createdAt: Date;
}
