/**
 * Simple logger utility
 */

import { config } from "../config";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[config.logLevel] ?? LOG_LEVELS.info;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const formatted = args.length > 0 ? `${message} ${JSON.stringify(args)}` : message;
  return `[${timestamp}] [${level.toUpperCase()}] ${formatted}`;
}

async function writeToFile(message: string): Promise<void> {
  if (config.logToFile) {
    try {
      await Bun.write(config.logFilePath, message + "\n", { mode: "append" as unknown as number });
    } catch {
      // Silently fail file logging
    }
  }
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog("debug")) {
      const formatted = formatMessage("debug", message, ...args);
      console.debug(formatted);
      writeToFile(formatted);
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (shouldLog("info")) {
      const formatted = formatMessage("info", message, ...args);
      console.info(formatted);
      writeToFile(formatted);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog("warn")) {
      const formatted = formatMessage("warn", message, ...args);
      console.warn(formatted);
      writeToFile(formatted);
    }
  },

  error(message: string, ...args: unknown[]): void {
    if (shouldLog("error")) {
      const formatted = formatMessage("error", message, ...args);
      console.error(formatted);
      writeToFile(formatted);
    }
  },
};

