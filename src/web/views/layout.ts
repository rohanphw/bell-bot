export function layout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Bell Admin</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    nav {
      background: #2c3e50;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    nav a {
      color: white;
      text-decoration: none;
      margin-right: 20px;
      font-weight: 500;
    }
    nav a:hover { text-decoration: underline; }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card h2 {
      margin-top: 0;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }
    th { background: #f8f9fa; }
    tr:hover { background: #f8f9fa; }
    a { color: #3498db; }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card h3 { margin: 0; color: #7f8c8d; font-size: 14px; }
    .stat-card .value { font-size: 36px; font-weight: bold; color: #2c3e50; }
    .message {
      padding: 10px 15px;
      margin: 8px 0;
      border-radius: 8px;
      max-width: 80%;
    }
    .message.user {
      background: #3498db;
      color: white;
      margin-left: auto;
    }
    .message.assistant {
      background: #ecf0f1;
      color: #333;
    }
    .message .meta {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 5px;
    }
    .tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 10px;
    }
    .tag.daily { background: #e8f5e9; color: #2e7d32; }
    .tag.weekly { background: #e3f2fd; color: #1565c0; }
    .tag.pending { background: #fff3e0; color: #ef6c00; }
    .tag.sent { background: #e3f2fd; color: #1565c0; }
    .tag.responded { background: #e8f5e9; color: #2e7d32; }
    .tag.no-response { background: #fce4ec; color: #c62828; }
    .tag.expired { background: #f5f5f5; color: #757575; }
    .tag.completed { background: #f5f5f5; color: #757575; }
    pre {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 15px;
    }
    button {
      background: #3498db;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }
    button:hover {
      background: #2980b9;
    }
    button:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }
    button.danger {
      background: #e74c3c;
    }
    button.danger:hover {
      background: #c0392b;
    }
    #action-result {
      margin-top: 10px;
    }
    .success {
      color: #27ae60;
      font-weight: 500;
    }
    .error {
      color: #e74c3c;
      font-weight: 500;
    }
    .followup-card {
      border-left: 4px solid #3498db;
    }
    .followup-details {
      margin-top: 10px;
    }
    .followup-details p {
      margin: 5px 0;
    }
    .followup-message {
      margin: 10px 0;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .followup-message .message {
      max-width: 100%;
      margin: 5px 0;
    }
    /* Logs styles */
    .log-filters {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .log-filters select {
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #ddd;
      font-size: 14px;
    }
    .logs-container {
      max-height: 600px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 13px;
    }
    .log-entry {
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: flex-start;
    }
    .log-entry:hover {
      background: #f8f9fa;
    }
    .log-time {
      color: #7f8c8d;
      min-width: 180px;
    }
    .log-level {
      font-weight: bold;
      min-width: 60px;
    }
    .log-category {
      color: #8e44ad;
      min-width: 100px;
    }
    .log-message {
      flex: 1;
    }
    .log-data {
      width: 100%;
      margin: 5px 0 0 0;
      font-size: 12px;
      background: #f1f1f1;
    }
    .log-info .log-level { color: #3498db; }
    .log-warn .log-level { color: #f39c12; }
    .log-error .log-level { color: #e74c3c; }
    .log-error { background: #fdf2f2; }
    .log-debug .log-level { color: #95a5a6; }
  </style>
</head>
<body>
  <nav>
    <a href="/">📊 Dashboard</a>
    <a href="/chats">💬 Chats</a>
    <a href="/logs">📜 Logs</a>
  </nav>
  ${content}
</body>
</html>`;
}
