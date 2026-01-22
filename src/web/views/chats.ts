import { layout } from "./layout";

interface Chat {
  chatId: number;
  messageCount: number;
  lastMessage: string;
}

export function chatsListView(chats: Chat[]): string {
  const rows = chats.map(chat => `
    <tr>
      <td><a href="/chats/${chat.chatId}">${chat.chatId}</a></td>
      <td>${chat.messageCount}</td>
      <td>${new Date(chat.lastMessage).toLocaleString()}</td>
    </tr>
  `).join("");

  const content = `
    <h1>All Chats</h1>
    
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Chat ID</th>
            <th>Messages</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          ${rows || "<tr><td colspan='3'>No chats yet</td></tr>"}
        </tbody>
      </table>
    </div>
  `;

  return layout("Chats", content);
}