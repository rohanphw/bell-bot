import { env } from "../config/env";

interface LogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;

  private add(
    level: LogEntry["level"],
    category: string,
    message: string,
    data?: any,
  ) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also console log with formatting
    const time = entry.timestamp.toISOString().split("T")[1].split(".")[0];
    const prefix = `[${time}] [${level.toUpperCase()}] [${category}]`;

    if (level === "error") {
      console.error(`${prefix} ${message}`, data || "");
    } else if (level === "warn") {
      console.warn(`${prefix} ${message}`, data || "");
    } else {
      console.log(`${prefix} ${message}`, data || "");
    }
  }

  info(category: string, message: string, data?: any) {
    this.add("info", category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.add("warn", category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.add("error", category, message, data);
  }

  debug(category: string, message: string, data?: any) {
    this.add("debug", category, message, data);
  }

  getLogs(limit = 100, level?: string, category?: string): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((l) => l.level === level);
    }

    if (category) {
      filtered = filtered.filter((l) =>
        l.category.toLowerCase().includes(category.toLowerCase()),
      );
    }

    return filtered.slice(-limit).reverse();
  }

  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();
