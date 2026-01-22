import { layout } from "./layout";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Summary {
  id: string;
  type: string;
  content: string;
  periodStart: string;
  periodEnd: string;
}

interface Followup {
  id: string;
  topic: string;
  triggerAt: string;
  completed: number | boolean;
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
      .map((f) => {
        const isCompleted = f.completed === 1 || f.completed === true;
        return `
    <div class="card">
      <span class="tag ${isCompleted ? "completed" : "pending"}">${isCompleted ? "done" : "pending"}</span>
      <strong>${escapeHtml(f.topic)}</strong>
      <p>Trigger: ${new Date(f.triggerAt).toLocaleString()}</p>
    </div>
  `;
      })
      .join("") || "<p>No followups</p>";

  const profileHtml =
    Object.entries(data.profile).length > 0
      ? `<pre>${escapeHtml(JSON.stringify(data.profile, null, 2))}</pre>`
      : "<p>No profile data yet</p>";

  const content = `
    <h1>Chat ${data.chatId}</h1>
    
    <div class="card">
      <h2>Actions</h2>
      <div class="actions">
        <button onclick="runAction('summarize')" id="btn-summarize">📝 Generate Summary</button>
        <button onclick="runAction('extract-profile')" id="btn-profile">🧠 Extract Profile</button>
        <button onclick="runAction('extract-followups')" id="btn-followups">📋 Extract Followups</button>
      </div>
      <div id="action-result"></div>
    </div>

    <div class="card">
      <h2>Profile</h2>
      <div id="profile-content">${profileHtml}</div>
    </div>

    <div class="card">
      <h2>Followups</h2>
      <div id="followups-content">${followupsHtml}</div>
    </div>

    <div class="card">
      <h2>Summaries</h2>
      <div id="summaries-content">${summariesHtml}</div>
    </div>

    <div class="card">
      <h2>Recent Messages</h2>
      ${messagesHtml || "<p>No messages yet</p>"}
    </div>

    <script>
      async function runAction(action) {
        const btn = document.getElementById('btn-' + action.replace('extract-', ''));
        const resultDiv = document.getElementById('action-result');
        
        btn.disabled = true;
        btn.textContent = 'Processing...';
        resultDiv.innerHTML = '<p>Running...</p>';
        
        try {
          const response = await fetch('/api/chats/${data.chatId}/' + action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const result = await response.json();
          
          if (result.success) {
            resultDiv.innerHTML = '<p class="success">✅ Success! Refreshing page...</p>';
            setTimeout(() => window.location.reload(), 1500);
          } else {
            resultDiv.innerHTML = '<p class="error">❌ ' + (result.message || 'Failed') + '</p>';
          }
        } catch (error) {
          resultDiv.innerHTML = '<p class="error">❌ Error: ' + error.message + '</p>';
        } finally {
          btn.disabled = false;
          btn.textContent = btn.textContent.replace('Processing...', '');
        }
      }
    </script>
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
