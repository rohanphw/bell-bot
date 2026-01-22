import { layout } from "./layout";

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

interface Summary {
  id: number;
  type: string;
  content: string;
  periodStart: string;
  periodEnd: string;
}

interface Followup {
  id: number;
  topic: string;
  triggerAt: string;
  completed: number;
}

interface ChatDetail {
  chatId: number;
  messages: Message[];
  summaries: Summary[];
  followups: Followup[];
  profile: Record<string, string>;
}

export function chatDetailView(data: ChatDetail): string {
  const messagesHtml = data.messages
    .map(
      (m) => `
    <div class="message ${m.role}">
      <div>${escapeHtml(m.content)}</div>
      <div class="meta">${new Date(m.createdAt).toLocaleString()}</div>
    </div>
  `,
    )
    .join("");

  const summariesHtml =
    data.summaries
      .map(
        (s) => `
    <div class="card">
      <span class="tag ${s.type}">${s.type}</span>
      <p>${escapeHtml(s.content)}</p>
      <small>${new Date(s.periodStart).toLocaleDateString()} - ${new Date(s.periodEnd).toLocaleDateString()}</small>
    </div>
  `,
      )
      .join("") || "<p>No summaries yet</p>";

  const followupsHtml =
    data.followups
      .map(
        (f) => `
    <div class="card">
      <span class="tag ${f.completed ? "completed" : "pending"}">${f.completed ? "done" : "pending"}</span>
      <strong>${escapeHtml(f.topic)}</strong>
      <p>Trigger: ${new Date(f.triggerAt).toLocaleString()}</p>
    </div>
  `,
      )
      .join("") || "<p>No followups</p>";

  const profileHtml =
    Object.entries(data.profile).length > 0
      ? `<pre>${escapeHtml(JSON.stringify(data.profile, null, 2))}</pre>`
      : "<p>No profile data yet</p>";

  const content = `
    <h1>Chat ${data.chatId}</h1>
    
    <div class="card">
      <h2>Profile</h2>
      ${profileHtml}
    </div>

    <div class="card">
      <h2>Followups</h2>
      ${followupsHtml}
    </div>

    <div class="card">
      <h2>Summaries</h2>
      ${summariesHtml}
    </div>

    <div class="card">
      <h2>Recent Messages</h2>
      ${messagesHtml || "<p>No messages yet</p>"}
    </div>
  `;

  return layout(`Chat ${data.chatId}`, content);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
