import { layout } from "./layout";

interface Stats {
  totalChats: number;
  totalMessages: number;
  totalSummaries: number;
  pendingFollowups: number;
}

export function dashboardView(stats: Stats): string {
  const content = `
    <h1>Bell Admin Dashboard</h1>
    
    <div class="stat-grid">
      <div class="stat-card">
        <h3>Total Chats</h3>
        <div class="value">${stats.totalChats}</div>
      </div>
      <div class="stat-card">
        <h3>Total Messages</h3>
        <div class="value">${stats.totalMessages}</div>
      </div>
      <div class="stat-card">
        <h3>Summaries</h3>
        <div class="value">${stats.totalSummaries}</div>
      </div>
      <div class="stat-card">
        <h3>Pending Followups</h3>
        <div class="value">${stats.pendingFollowups}</div>
      </div>
    </div>
  `;

  return layout("Dashboard", content);
}