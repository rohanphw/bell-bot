import { layout } from "./layout";

interface LogEntry {
  timestamp: Date;
  level: string;
  category: string;
  message: string;
  data?: any;
}

export function logsView(logs: LogEntry[]): string {
  const logsHtml = logs
    .map((log) => {
      const time = new Date(log.timestamp).toLocaleString();
      const levelClass = `log-${log.level}`;
      const dataHtml = log.data
        ? `<pre class="log-data">${escapeHtml(JSON.stringify(log.data, null, 2))}</pre>`
        : "";

      return `
      <div class="log-entry ${levelClass}">
        <span class="log-time">${time}</span>
        <span class="log-level">${log.level.toUpperCase()}</span>
        <span class="log-category">${escapeHtml(log.category)}</span>
        <span class="log-message">${escapeHtml(log.message)}</span>
        ${dataHtml}
      </div>
    `;
    })
    .join("");

  const content = `
    <h1>System Logs</h1>
    
    <div class="card">
      <h2>Filters</h2>
      <div class="log-filters">
        <select id="level-filter" onchange="applyFilters()">
          <option value="">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="debug">Debug</option>
        </select>
        <select id="category-filter" onchange="applyFilters()">
          <option value="">All Categories</option>
          <option value="message">Message</option>
          <option value="response">Response</option>
          <option value="scheduler">Scheduler</option>
          <option value="followup">Followup</option>
          <option value="extraction">Extraction</option>
          <option value="startup">Startup</option>
        </select>
        <button onclick="refreshLogs()">🔄 Refresh</button>
        <button onclick="clearLogs()" class="danger">🗑️ Clear Logs</button>
      </div>
    </div>

    <div class="card">
      <h2>Logs</h2>
      <div id="logs-container" class="logs-container">
        ${logsHtml || "<p>No logs yet</p>"}
      </div>
    </div>

    <script>
      async function refreshLogs() {
        const level = document.getElementById('level-filter').value;
        const category = document.getElementById('category-filter').value;
        
        let url = '/api/logs?limit=200';
        if (level) url += '&level=' + level;
        if (category) url += '&category=' + category;
        
        const response = await fetch(url);
        const logs = await response.json();
        
        const container = document.getElementById('logs-container');
        if (logs.length === 0) {
          container.innerHTML = '<p>No logs found</p>';
          return;
        }
        
        container.innerHTML = logs.map(log => {
          const time = new Date(log.timestamp).toLocaleString();
          const levelClass = 'log-' + log.level;
          const dataHtml = log.data ? '<pre class="log-data">' + escapeHtml(JSON.stringify(log.data, null, 2)) + '</pre>' : '';
          
          return '<div class="log-entry ' + levelClass + '">' +
            '<span class="log-time">' + time + '</span>' +
            '<span class="log-level">' + log.level.toUpperCase() + '</span>' +
            '<span class="log-category">' + escapeHtml(log.category) + '</span>' +
            '<span class="log-message">' + escapeHtml(log.message) + '</span>' +
            dataHtml +
          '</div>';
        }).join('');
      }
      
      function applyFilters() {
        refreshLogs();
      }
      
      async function clearLogs() {
        if (!confirm('Are you sure you want to clear all logs?')) return;
        
        await fetch('/api/logs/clear', { method: 'POST' });
        refreshLogs();
      }
      
      function escapeHtml(text) {
        if (typeof text !== 'string') return text;
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      
      // Auto-refresh every 10 seconds
      setInterval(refreshLogs, 10000);
    </script>
  `;

  return layout("Logs", content);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
